import { getChatGPTUser } from "../../chatgpt-auth";
import { encryptPassport } from "../../lib/guest-crypto";
import { bangkokToday, occupiedRoomSet } from "../../lib/occupancy";
import { setConfiguredRoomAvailability } from "../../lib/room-availability";
import { normalizeRoomNumber } from "../../lib/rooms";
import { bindings, ensureSchema } from "../../lib/storage";

type ResidentInput = {
  fullName?: string; phone?: string; email?: string; nationality?: string;
  residentType?: string; passportNumber?: string; roomNumber?: string;
  checkInDate?: string; checkOutDate?: string; consentConfirmed?: boolean;
  fromInquiryId?: string;
};

type ResidentStatusInput = { id?: string; status?: string; checkInDate?: string; checkOutDate?: string };

const clean = (value: string | undefined, length: number) => value?.trim().slice(0, length) ?? "";

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const { DB } = bindings(); await ensureSchema(DB!);
    const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
    const rows = name
      ? await DB!.prepare("SELECT id, full_name AS fullName, phone, email, nationality, resident_type AS residentType, passport_last4 AS passportLast4, room_number AS roomNumber, check_in_date AS checkInDate, check_out_date AS checkOutDate, status, consent_recorded_at AS consentRecordedAt, created_at AS createdAt FROM residents WHERE LOWER(full_name) LIKE ? OR room_number LIKE ? ORDER BY created_at DESC LIMIT 200").bind(`%${name.toLowerCase()}%`, `%${name}%`).all()
      : await DB!.prepare("SELECT id, full_name AS fullName, phone, email, nationality, resident_type AS residentType, passport_last4 AS passportLast4, room_number AS roomNumber, check_in_date AS checkInDate, check_out_date AS checkOutDate, status, consent_recorded_at AS consentRecordedAt, created_at AS createdAt FROM residents ORDER BY created_at DESC LIMIT 200").all();
    return Response.json(rows.results ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resident list failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const input = await request.json() as ResidentInput;
    const fullName = clean(input.fullName, 160);
    if (!fullName) return Response.json({ error: "Full name is required" }, { status: 400 });
    if (!input.consentConfirmed) return Response.json({ error: "Confirm consent before storing personal data" }, { status: 400 });

    const runtime = bindings(); await ensureSchema(runtime.DB!);
    const passport = clean(input.passportNumber, 40).replace(/\s+/g, "").toUpperCase();
    let passportCiphertext = "";
    if (passport && runtime.GUEST_DATA_ENCRYPTION_KEY) {
      try {
        passportCiphertext = await encryptPassport(passport, runtime.GUEST_DATA_ENCRYPTION_KEY);
      } catch {
        passportCiphertext = "";
      }
    }
    const now = Date.now();
    const record = {
      id: crypto.randomUUID(), fullName, phone: clean(input.phone, 80), email: clean(input.email, 160).toLowerCase(),
      nationality: clean(input.nationality, 80), residentType: clean(input.residentType, 40) || "monthly",
      passportCiphertext, passportLast4: passport.slice(-4), roomNumber: normalizeRoomNumber(clean(input.roomNumber, 20)),
      checkInDate: clean(input.checkInDate, 20) || bangkokToday(), checkOutDate: clean(input.checkOutDate, 20), now,
    };
    await runtime.DB!.prepare("INSERT INTO residents (id, full_name, phone, email, nationality, resident_type, passport_ciphertext, passport_last4, room_number, check_in_date, check_out_date, status, consent_recorded_at, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)")
      .bind(record.id, record.fullName, record.phone, record.email, record.nationality, record.residentType, record.passportCiphertext, record.passportLast4, record.roomNumber, record.checkInDate, record.checkOutDate, now, now, now, user.email).run();
    if (record.roomNumber) await setConfiguredRoomAvailability(runtime.DB!, record.roomNumber, false, user.email);
    const fromInquiryId = clean(input.fromInquiryId, 80);
    if (fromInquiryId) {
      await runtime.DB!.prepare("UPDATE inquiries SET status = 'converted', converted_resident_id = ?, updated_at = ? WHERE id = ?")
        .bind(record.id, now, fromInquiryId).run();
    }
    return Response.json({ ok: true, resident: { ...record, passportCiphertext: undefined } }, { status: 201 });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const message = !raw || raw === "Invalid character"
      ? "Resident save failed. Leave the passport field empty and try again, or set a simple GUEST_DATA_ENCRYPTION_KEY on Render."
      : raw;
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as ResidentStatusInput;
  const id = clean(input.id, 80);
  if (!id) return Response.json({ error: "Resident id is required" }, { status: 400 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const resident = await DB!.prepare("SELECT room_number AS roomNumber, status FROM residents WHERE id = ?").bind(id).first<{ roomNumber: string; status: string }>();
  if (!resident) return Response.json({ error: "Resident not found" }, { status: 404 });

  if (input.checkInDate !== undefined || input.checkOutDate !== undefined) {
    const checkInDate = clean(input.checkInDate, 20);
    const checkOutDate = clean(input.checkOutDate, 20);
    await DB!.prepare("UPDATE residents SET check_in_date = ?, check_out_date = ?, updated_at = ? WHERE id = ?")
      .bind(checkInDate, checkOutDate, Date.now(), id).run();
    const occupied = await occupiedRoomSet(DB!);
    await setConfiguredRoomAvailability(DB!, resident.roomNumber, !occupied.has(normalizeRoomNumber(resident.roomNumber)), user.email);
    return Response.json({ ok: true, id, checkInDate, checkOutDate });
  }

  const status = input.status === "checked_out" ? "checked_out" : input.status === "active" ? "active" : "";
  if (!status) return Response.json({ error: "A valid status or dates are required" }, { status: 400 });
  await DB!.prepare("UPDATE residents SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, Date.now(), id).run();
  const occupied = await occupiedRoomSet(DB!);
  await setConfiguredRoomAvailability(DB!, resident.roomNumber, !occupied.has(normalizeRoomNumber(resident.roomNumber)), user.email);
  return Response.json({ ok: true, id, status });
}

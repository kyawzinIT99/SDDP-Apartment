import { getChatGPTUser } from "../../chatgpt-auth";
import { encryptPassport } from "../../lib/guest-crypto";
import { bangkokToday } from "../../lib/occupancy";
import { normalizeRoomNumber } from "../../lib/rooms";
import { bindings, ensureSchema } from "../../lib/storage";

type ResidentInput = {
  fullName?: string; phone?: string; email?: string; nationality?: string;
  residentType?: string; passportNumber?: string; roomNumber?: string;
  checkInDate?: string; checkOutDate?: string; consentConfirmed?: boolean;
  fromInquiryId?: string;
};

type ResidentStatusInput = { id?: string; status?: string };

const clean = (value: string | undefined, length: number) => value?.trim().slice(0, length) ?? "";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const { DB } = bindings(); await ensureSchema(DB!);
    const rows = await DB!.prepare("SELECT id, full_name AS fullName, phone, email, nationality, resident_type AS residentType, passport_last4 AS passportLast4, room_number AS roomNumber, check_in_date AS checkInDate, check_out_date AS checkOutDate, status, consent_recorded_at AS consentRecordedAt, created_at AS createdAt FROM residents ORDER BY created_at DESC LIMIT 200").all();
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
    if (passport && !runtime.GUEST_DATA_ENCRYPTION_KEY) return Response.json({ error: "Encrypted passport storage is not configured" }, { status: 503 });
    const passportCiphertext = passport ? await encryptPassport(passport, runtime.GUEST_DATA_ENCRYPTION_KEY!) : null;
    const now = Date.now();
    const record = {
      id: crypto.randomUUID(), fullName, phone: clean(input.phone, 80), email: clean(input.email, 160).toLowerCase(),
      nationality: clean(input.nationality, 80), residentType: clean(input.residentType, 40) || "monthly",
      passportCiphertext, passportLast4: passport.slice(-4), roomNumber: normalizeRoomNumber(clean(input.roomNumber, 20)),
      checkInDate: clean(input.checkInDate, 20) || bangkokToday(), checkOutDate: clean(input.checkOutDate, 20), now,
    };
    await runtime.DB!.prepare("INSERT INTO residents (id, full_name, phone, email, nationality, resident_type, passport_ciphertext, passport_last4, room_number, check_in_date, check_out_date, status, consent_recorded_at, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)")
      .bind(record.id, record.fullName, record.phone, record.email, record.nationality, record.residentType, record.passportCiphertext, record.passportLast4, record.roomNumber, record.checkInDate, record.checkOutDate, now, now, now, user.email).run();
    const fromInquiryId = clean(input.fromInquiryId, 80);
    if (fromInquiryId) {
      await runtime.DB!.prepare("UPDATE inquiries SET status = 'converted', converted_resident_id = ?, updated_at = ? WHERE id = ?")
        .bind(record.id, now, fromInquiryId).run();
    }
    return Response.json({ ok: true, resident: { ...record, passportCiphertext: undefined } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resident save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as ResidentStatusInput;
  const id = clean(input.id, 80);
  const status = input.status === "checked_out" ? "checked_out" : input.status === "active" ? "active" : "";
  if (!id || !status) return Response.json({ error: "A valid resident and status are required" }, { status: 400 });
  const { DB } = bindings(); await ensureSchema(DB!);
  await DB!.prepare("UPDATE residents SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, Date.now(), id).run();
  return Response.json({ ok: true, id, status });
}

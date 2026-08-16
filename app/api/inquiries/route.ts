import { getChatGPTUser } from "../../chatgpt-auth";
import { occupiedRoomSet } from "../../lib/occupancy";
import { normalizeRoomNumber, roomCatalog } from "../../lib/rooms";
import { bindings, ensureSchema } from "../../lib/storage";

type InquiryInput = { name?: string; phone?: string; channel?: string; stayType?: string; roomNumber?: string; arrivalDate?: string; message?: string; locale?: string };
type InquiryPatch = { id?: string; status?: string; notes?: string };
const pipeline = ["new", "contacted", "booked", "lost", "converted"] as const;

export async function POST(request: Request) {
  const input = await request.json() as InquiryInput;
  if (!input.name?.trim() || !input.phone?.trim()) return Response.json({ error: "Name and contact are required" }, { status: 400 });
  const roomNumber = normalizeRoomNumber(input.roomNumber ?? "");
  if (!roomNumber) return Response.json({ error: "Please select an available room", code: "room_required" }, { status: 400 });
  if (!roomCatalog.some((room) => room.roomNumber === roomNumber)) return Response.json({ error: "Please select a valid room", code: "invalid_room" }, { status: 400 });
  const runtime = bindings(); await ensureSchema(runtime.DB!);
  const occupied = await occupiedRoomSet(runtime.DB!);
  const availableRooms = roomCatalog.map((room) => room.roomNumber).filter((room) => !occupied.has(room));
  if (occupied.has(roomNumber)) return Response.json({ error: "That room is now occupied. Please choose an available room.", code: "room_unavailable", roomNumber, availableRooms }, { status: 409 });
  const now = Date.now();
  const record = { id: crypto.randomUUID(), name: input.name.trim().slice(0, 120), phone: input.phone.trim().slice(0, 80), channel: input.channel ?? "phone", stayType: input.stayType ?? "monthly", roomNumber, arrivalDate: input.arrivalDate ?? "", message: input.message?.trim().slice(0, 1000) ?? "", locale: input.locale ?? "en", createdAt: now };
  await runtime.DB!.prepare("INSERT INTO inquiries (id, name, phone, channel, stay_type, room_number, arrival_date, message, locale, status, notes, converted_resident_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', '', '', ?, ?)")
    .bind(record.id, record.name, record.phone, record.channel, record.stayType, record.roomNumber, record.arrivalDate, record.message, record.locale, now, now).run();
  let routed = false;
  if (runtime.N8N_INQUIRY_WEBHOOK) {
    try { const response = await fetch(runtime.N8N_INQUIRY_WEBHOOK, { method: "POST", headers: { "content-type": "application/json", ...(runtime.N8N_WEBHOOK_SECRET ? { "x-sddp-webhook-secret": runtime.N8N_WEBHOOK_SECRET } : {}) }, body: JSON.stringify({ event: "sddp.inquiry.created", ...record }) }); routed = response.ok; } catch { routed = false; }
  }
  return Response.json({ ok: true, inquiryId: record.id, routed }, { status: 201 });
}

export async function GET() {
  const user = await getChatGPTUser(); if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const rows = await DB!.prepare("SELECT id, name, phone, channel, stay_type AS stayType, room_number AS roomNumber, arrival_date AS arrivalDate, message, locale, status, notes, converted_resident_id AS convertedResidentId, created_at AS createdAt, updated_at AS updatedAt FROM inquiries ORDER BY created_at DESC LIMIT 100").all();
  return Response.json(rows.results ?? []);
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as InquiryPatch;
  const id = input.id?.trim() ?? "";
  if (!id) return Response.json({ error: "Inquiry id is required" }, { status: 400 });
  const status = pipeline.includes(input.status as typeof pipeline[number]) ? input.status : undefined;
  const notes = input.notes?.slice(0, 2000);
  const { DB } = bindings(); await ensureSchema(DB!);
  const current = await DB!.prepare("SELECT id FROM inquiries WHERE id = ?").bind(id).first<{ id: string }>();
  if (!current) return Response.json({ error: "Inquiry not found" }, { status: 404 });
  if (status) await DB!.prepare("UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?").bind(status, Date.now(), id).run();
  if (notes !== undefined) await DB!.prepare("UPDATE inquiries SET notes = ?, updated_at = ? WHERE id = ?").bind(notes, Date.now(), id).run();
  return Response.json({ ok: true, id, status, notes });
}

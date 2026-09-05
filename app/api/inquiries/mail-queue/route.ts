import { inquiryMailPayload, mailQueueAuthorized, type InquiryMailRecord } from "../../../lib/n8n-inquiry";
import { bindings, ensureSchema } from "../../../lib/storage";

type QueueRow = {
  id: string; name: string; phone: string; email: string; channel: string; stayType: string;
  roomNumber: string; arrivalDate: string; message: string; locale: string; createdAt: number;
};

export async function GET(request: Request) {
  if (!mailQueueAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const rows = await DB!.prepare(
    "SELECT id, name, phone, email, channel, stay_type AS stayType, room_number AS roomNumber, arrival_date AS arrivalDate, message, locale, created_at AS createdAt FROM inquiries WHERE mail_sent = 0 AND email LIKE '%@%' AND email NOT LIKE '%@example.com' ORDER BY created_at ASC LIMIT 5",
  ).all<QueueRow>();
  const inquiries = [];
  for (const row of rows.results ?? []) {
    inquiries.push(await inquiryMailPayload(row as InquiryMailRecord));
  }
  return Response.json({ inquiries });
}

export async function POST(request: Request) {
  if (!mailQueueAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as { ids?: string[] };
  const ids = (input.ids ?? []).map((id) => String(id).trim()).filter(Boolean).slice(0, 20);
  if (!ids.length) return Response.json({ ok: true, marked: 0 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const now = Date.now();
  for (const id of ids) {
    await DB!.prepare("UPDATE inquiries SET mail_sent = 1, updated_at = ? WHERE id = ?").bind(now, id).run();
  }
  return Response.json({ ok: true, marked: ids.length });
}

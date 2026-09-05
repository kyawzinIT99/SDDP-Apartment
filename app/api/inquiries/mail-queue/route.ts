import { inquiryMailPayload, mailQueueAuthorized, type InquiryMailRecord } from "../../../lib/n8n-inquiry";
import { bindings, ensureSchema } from "../../../lib/storage";

type QueueRow = {
  id: string; name: string; phone: string; email: string; channel: string; stayType: string;
  roomNumber: string; arrivalDate: string; message: string; locale: string; createdAt: number;
};

/** Claim waiting inquiries once, then return them. Claim-before-send stops the every-minute resend loop. */
export async function GET(request: Request) {
  if (!mailQueueAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const rows = await DB!.prepare(
    "SELECT id, name, phone, email, channel, stay_type AS stayType, room_number AS roomNumber, arrival_date AS arrivalDate, message, locale, created_at AS createdAt FROM inquiries WHERE mail_sent = 0 AND email LIKE '%@%' AND email NOT LIKE '%@example.com' ORDER BY created_at ASC LIMIT 5",
  ).all<QueueRow>();
  const waiting = rows.results ?? [];
  const now = Date.now();
  const claimed: QueueRow[] = [];
  for (const row of waiting) {
    // Only claim rows still unmarked (avoids double-send if two polls overlap).
    const current = await DB!.prepare("SELECT mail_sent AS mailSent FROM inquiries WHERE id = ?").bind(row.id).first<{ mailSent: number }>();
    if (!current || Number(current.mailSent) !== 0) continue;
    await DB!.prepare("UPDATE inquiries SET mail_sent = 1, updated_at = ? WHERE id = ? AND mail_sent = 0").bind(now, row.id).run();
    const locked = await DB!.prepare("SELECT mail_sent AS mailSent FROM inquiries WHERE id = ?").bind(row.id).first<{ mailSent: number }>();
    if (Number(locked?.mailSent) !== 1) continue;
    claimed.push(row);
  }
  const inquiries = [];
  for (const row of claimed) {
    inquiries.push(await inquiryMailPayload(row as InquiryMailRecord));
  }
  return Response.json({ inquiries, claim: true });
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

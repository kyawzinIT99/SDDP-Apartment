import { getChatGPTUser } from "../../chatgpt-auth";
import { bangkokToday } from "../../lib/occupancy";
import { buildInvoice, padBook, padInvoiceNo, type InvoiceInput } from "../../lib/invoice";
import { bindings, ensureSchema } from "../../lib/storage";

const selectSql = "SELECT id, book_number AS bookNumber, invoice_number AS invoiceNumber, room_number AS roomNumber, resident_name AS residentName, address, billing_month AS billingMonth, billing_year AS billingYear, issue_date AS issueDate, rent_amount AS rentAmount, electric_rate AS electricRate, electric_prev AS electricPrev, electric_curr AS electricCurr, electric_units AS electricUnits, electric_amount AS electricAmount, water_rate AS waterRate, water_prev AS waterPrev, water_curr AS waterCurr, water_units AS waterUnits, water_amount AS waterAmount, other_label AS otherLabel, other_amount AS otherAmount, total, total_words AS totalWords, created_at AS createdAt FROM invoices";

async function nextNumbers(db: NonNullable<ReturnType<typeof bindings>["DB"]>) {
  const latest = await db.prepare("SELECT book_number AS bookNumber, invoice_number AS invoiceNumber FROM invoices ORDER BY created_at DESC LIMIT 1").first<{ bookNumber: string; invoiceNumber: string }>();
  if (!latest) return { bookNumber: "014", invoiceNumber: "0691" };
  const next = Number(latest.invoiceNumber) + 1;
  if (next > 9999) return { bookNumber: padBook(Number(latest.bookNumber) + 1), invoiceNumber: "0001" };
  return { bookNumber: padBook(latest.bookNumber), invoiceNumber: padInvoiceNo(next) };
}

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const { DB } = bindings(); await ensureSchema(DB!);
    const room = new URL(request.url).searchParams.get("room")?.trim() ?? "";
    const rows = await DB!.prepare(`${selectSql} ORDER BY created_at DESC LIMIT 100`).all();
    const lastForRoom = room
      ? await DB!.prepare(`${selectSql} WHERE room_number = ? ORDER BY created_at DESC LIMIT 1`).bind(room).first()
      : null;
    return Response.json({ invoices: rows.results ?? [], next: await nextNumbers(DB!), lastForRoom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invoice list failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const input = await request.json() as InvoiceInput;
    if (!input.residentName?.trim()) return Response.json({ error: "Guest name is required" }, { status: 400 });
    if (!input.roomNumber?.trim()) return Response.json({ error: "Room number is required" }, { status: 400 });
    const { DB } = bindings(); await ensureSchema(DB!);
    const next = await nextNumbers(DB!);
    const record = buildInvoice(input, { ...next, issueDate: bangkokToday() });
    if (record.billingYear.length !== 4) return Response.json({ error: "Type a 4-digit year such as 2026" }, { status: 400 });
    const id = crypto.randomUUID();
    const now = Date.now();
    await DB!.prepare("INSERT INTO invoices (id, book_number, invoice_number, room_number, resident_name, address, billing_month, billing_year, issue_date, rent_amount, electric_rate, electric_prev, electric_curr, electric_units, electric_amount, water_rate, water_prev, water_curr, water_units, water_amount, other_label, other_amount, total, total_words, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, record.bookNumber, record.invoiceNumber, record.roomNumber, record.residentName, record.address, record.billingMonth, record.billingYear, record.issueDate, record.rentAmount, record.electricRate, record.electricPrev, record.electricCurr, record.electricUnits, record.electricAmount, record.waterRate, record.waterPrev, record.waterCurr, record.waterUnits, record.waterAmount, record.otherLabel, record.otherAmount, record.total, record.totalWords, now, user.email).run();
    return Response.json({ ok: true, invoice: { id, ...record, createdAt: now } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invoice save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

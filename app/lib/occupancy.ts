import { normalizeRoomNumber, publicRoomBoard } from "./rooms";
import type { D1Database } from "./storage";

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function occupiedRoomSet(db: D1Database) {
  const today = bangkokToday();
  const occupiedRows = await db.prepare(
    "SELECT DISTINCT room_number AS roomNumber FROM residents WHERE status = 'active' AND TRIM(room_number) <> '' AND (check_in_date IS NULL OR check_in_date = '' OR check_in_date <= ?) AND (check_out_date IS NULL OR check_out_date = '' OR check_out_date >= ?)",
  ).bind(today, today).all<{ roomNumber: string }>();
  return new Set((occupiedRows.results ?? []).map((row) => normalizeRoomNumber(row.roomNumber)).filter(Boolean));
}

export { publicRoomBoard };

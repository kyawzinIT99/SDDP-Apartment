import { normalizeRoomNumber, publicRoomBoard } from "./rooms";
import type { D1Database } from "./storage";

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function roomFromRow(row: { room_number?: string; roomNumber?: string } | null | undefined) {
  return normalizeRoomNumber(String(row?.room_number ?? row?.roomNumber ?? ""));
}

export async function occupiedRoomSet(db: D1Database) {
  const occupied = new Set<string>();
  const residents = await db.prepare(
    "SELECT room_number FROM residents WHERE status != 'checked_out' AND TRIM(COALESCE(room_number, '')) <> ''",
  ).all<{ room_number?: string; roomNumber?: string }>();
  for (const row of residents.results ?? []) {
    const roomNumber = roomFromRow(row);
    if (roomNumber) occupied.add(roomNumber);
  }
  const deposits = await db.prepare(
    "SELECT room_number FROM inquiries WHERE status = 'deposit' AND TRIM(COALESCE(room_number, '')) <> ''",
  ).all<{ room_number?: string; roomNumber?: string }>();
  for (const row of deposits.results ?? []) {
    const roomNumber = roomFromRow(row);
    if (roomNumber) occupied.add(roomNumber);
  }
  return occupied;
}

export { publicRoomBoard };

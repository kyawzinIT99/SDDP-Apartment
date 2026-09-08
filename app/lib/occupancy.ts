import { catalogRoomFromValue, normalizeRoomNumber, publicRoomBoard } from "./rooms";
import type { D1Database } from "./storage";

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

type RoomRow = { id?: string; room_number?: string; roomNumber?: string; full_name?: string; fullName?: string; phone?: string };

function roomFromRow(row: RoomRow | null | undefined) {
  return catalogRoomFromValue(
    String(row?.room_number ?? row?.roomNumber ?? ""),
    String(row?.full_name ?? row?.fullName ?? ""),
    String(row?.phone ?? ""),
  );
}

export async function repairResidentRoomNumbers(db: D1Database) {
  const rows = await db.prepare(
    "SELECT id, room_number, full_name, phone FROM residents WHERE status != 'checked_out'",
  ).all<RoomRow>();
  for (const row of rows.results ?? []) {
    if (!row.id || catalogRoomFromValue(String(row.room_number ?? ""))) continue;
    const inferred = roomFromRow(row);
    if (!inferred) continue;
    await db.prepare("UPDATE residents SET room_number = ?, updated_at = ? WHERE id = ?")
      .bind(inferred, Date.now(), row.id).run();
  }
}

export async function occupiedRoomSet(db: D1Database) {
  await repairResidentRoomNumbers(db);
  const occupied = new Set<string>();
  const residents = await db.prepare(
    "SELECT room_number, full_name, phone FROM residents WHERE status != 'checked_out'",
  ).all<RoomRow>();
  for (const row of residents.results ?? []) {
    const roomNumber = roomFromRow(row);
    if (roomNumber) occupied.add(roomNumber);
  }
  const deposits = await db.prepare(
    "SELECT room_number FROM inquiries WHERE status = 'deposit' AND TRIM(COALESCE(room_number, '')) <> ''",
  ).all<RoomRow>();
  for (const row of deposits.results ?? []) {
    const roomNumber = normalizeRoomNumber(String(row.room_number ?? row.roomNumber ?? ""));
    if (roomNumber) occupied.add(roomNumber);
  }
  return occupied;
}

export { publicRoomBoard };

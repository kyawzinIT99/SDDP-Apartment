import { initialAvailableRoomNumbers, normalizeRoomNumber, roomCatalog } from "./rooms";
import type { D1Database } from "./storage";

// v2 resets the earlier inverted inventory once, then preserves all later
// changes made by staff and by the resident/deposit workflow.
const SETTING_ID = "room_availability_v2";
const catalogNumbers = new Set(roomCatalog.map((room) => room.roomNumber));

export async function configuredAvailableRooms(DB: D1Database) {
  const row = await DB.prepare("SELECT value FROM site_settings WHERE id = ?").bind(SETTING_ID).first<{ value: string }>();
  if (!row?.value) return new Set(initialAvailableRoomNumbers);
  try {
    const values = JSON.parse(row.value);
    return new Set(Array.isArray(values)
      ? values.map((value) => normalizeRoomNumber(String(value))).filter((roomNumber) => catalogNumbers.has(roomNumber))
      : initialAvailableRoomNumbers);
  } catch {
    return new Set(initialAvailableRoomNumbers);
  }
}

export async function saveConfiguredAvailableRooms(DB: D1Database, available: Iterable<string>, updatedBy: string) {
  const roomNumbers = [...new Set([...available]
    .map((value) => normalizeRoomNumber(String(value)))
    .filter((roomNumber) => catalogNumbers.has(roomNumber)))];
  await DB.prepare("INSERT INTO site_settings (id, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
    .bind(SETTING_ID, JSON.stringify(roomNumbers), Date.now(), updatedBy).run();
  return roomNumbers;
}

export async function setConfiguredRoomAvailability(DB: D1Database, roomNumber: string, available: boolean, updatedBy: string) {
  const normalized = normalizeRoomNumber(roomNumber);
  if (!catalogNumbers.has(normalized)) return;
  const rooms = await configuredAvailableRooms(DB);
  if (available) rooms.add(normalized); else rooms.delete(normalized);
  await saveConfiguredAvailableRooms(DB, rooms, updatedBy);
}

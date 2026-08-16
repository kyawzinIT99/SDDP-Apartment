import { bindings, ensureSchema } from "../../lib/storage";
import { inferFloor, normalizeRoomNumber, roomCatalog } from "../../lib/rooms";

type OccupiedRoomRow = { roomNumber: string };

export async function GET() {
  try {
    const { DB } = bindings();
    await ensureSchema(DB!);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const occupiedRows = await DB!.prepare(
      "SELECT DISTINCT room_number AS roomNumber FROM residents WHERE status = 'active' AND TRIM(room_number) <> '' AND (check_in_date IS NULL OR check_in_date = '' OR check_in_date <= ?) AND (check_out_date IS NULL OR check_out_date = '' OR check_out_date >= ?)",
    ).bind(today, today).all<OccupiedRoomRow>();
    const occupied = new Set(
      (occupiedRows.results ?? []).map((row) => normalizeRoomNumber(row.roomNumber)).filter(Boolean),
    );
    const masterNumbers = new Set(roomCatalog.map((room) => room.roomNumber));
    const additionalRooms = [...occupied]
      .filter((roomNumber) => !masterNumbers.has(roomNumber))
      .map((roomNumber, index) => ({
        roomNumber,
        floor: inferFloor(roomNumber),
        sortOrder: 9000 + index,
      }));
    const rooms = [...roomCatalog, ...additionalRooms]
      .sort((a, b) => a.floor.localeCompare(b.floor) || a.sortOrder - b.sortOrder)
      .map((room) => ({
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: occupied.has(room.roomNumber) ? "occupied" : "available",
      }));
    return Response.json({ updatedAt: Date.now(), rooms });
  } catch {
    return Response.json({ updatedAt: Date.now(), rooms: roomCatalog.map((room) => ({ ...room, status: "unknown" })), stale: true });
  }
}

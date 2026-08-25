import { getChatGPTUser } from "../../chatgpt-auth";
import { bindings, ensureSchema } from "../../lib/storage";
import { occupiedRoomSet } from "../../lib/occupancy";
import { catalogBoard, initialAvailableRoomNumbers, normalizeRoomNumber, publicRoomBoard, roomCatalog } from "../../lib/rooms";

const SETTING_ID = "room_availability";

async function configuredAvailableRooms(DB: NonNullable<ReturnType<typeof bindings>["DB"]>) {
  const row = await DB.prepare("SELECT value FROM site_settings WHERE id = ?").bind(SETTING_ID).first<{ value: string }>();
  if (!row?.value) return new Set(initialAvailableRoomNumbers);
  try {
    const values = JSON.parse(row.value);
    return new Set(Array.isArray(values) ? values.map((value) => normalizeRoomNumber(String(value))) : initialAvailableRoomNumbers);
  } catch {
    return new Set(initialAvailableRoomNumbers);
  }
}

async function roomResponse() {
  const { DB } = bindings();
  await ensureSchema(DB!);
  const [occupied, configuredAvailable] = await Promise.all([
    occupiedRoomSet(DB!),
    configuredAvailableRooms(DB!),
  ]);
  const rooms = publicRoomBoard(occupied, true, configuredAvailable);
  return { updatedAt: Date.now(), source: "database", managed: true, rooms };
}

export async function GET() {
  try {
    return Response.json(await roomResponse());
  } catch {
    return Response.json({ updatedAt: Date.now(), source: "catalog", stale: true, rooms: catalogBoard() });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as { availableRoomNumbers?: unknown };
  if (!Array.isArray(input.availableRoomNumbers)) {
    return Response.json({ error: "Available room numbers are required" }, { status: 400 });
  }

  const catalogNumbers = new Set(roomCatalog.map((room) => room.roomNumber));
  const availableRoomNumbers = [...new Set(input.availableRoomNumbers
    .map((value) => normalizeRoomNumber(String(value)))
    .filter((roomNumber) => catalogNumbers.has(roomNumber)))];
  const { DB } = bindings();
  await ensureSchema(DB!);
  await DB!.prepare("INSERT INTO site_settings (id, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
    .bind(SETTING_ID, JSON.stringify(availableRoomNumbers), Date.now(), user.email).run();
  return Response.json(await roomResponse());
}

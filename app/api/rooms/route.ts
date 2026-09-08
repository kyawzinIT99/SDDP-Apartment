import { getChatGPTUser } from "../../chatgpt-auth";
import { bindings, ensureSchema } from "../../lib/storage";
import { occupiedRoomSet } from "../../lib/occupancy";
import { saveConfiguredAvailableRooms } from "../../lib/room-availability";
import { catalogBoard, publicRoomBoard, roomCatalog } from "../../lib/rooms";

const noStore = { "Cache-Control": "no-store, max-age=0" };

async function roomResponse() {
  const { DB } = bindings();
  await ensureSchema(DB!);
  const occupied = await occupiedRoomSet(DB!);
  const rooms = publicRoomBoard(occupied, true);
  return { updatedAt: Date.now(), source: "database", managed: true, rooms };
}

export async function GET() {
  try {
    return Response.json(await roomResponse(), { headers: noStore });
  } catch {
    return Response.json({ updatedAt: Date.now(), source: "catalog", stale: true, rooms: catalogBoard() }, { headers: noStore });
  }
}

export async function PATCH() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { DB } = bindings();
  await ensureSchema(DB!);
  const occupied = await occupiedRoomSet(DB!);
  const availableRoomNumbers = roomCatalog.map((room) => room.roomNumber).filter((roomNumber) => !occupied.has(roomNumber));
  await saveConfiguredAvailableRooms(DB!, availableRoomNumbers, user.email);
  return Response.json(await roomResponse(), { headers: noStore });
}

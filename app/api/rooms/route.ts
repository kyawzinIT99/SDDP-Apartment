import { bindings, ensureSchema } from "../../lib/storage";
import { occupiedRoomSet } from "../../lib/occupancy";
import { catalogBoard, publicRoomBoard } from "../../lib/rooms";

export async function GET() {
  try {
    const { DB } = bindings();
    await ensureSchema(DB!);
    const occupied = await occupiedRoomSet(DB!);
    return Response.json({ updatedAt: Date.now(), source: "database", rooms: publicRoomBoard(occupied, true) });
  } catch {
    return Response.json({ updatedAt: Date.now(), source: "catalog", stale: true, rooms: catalogBoard() });
  }
}

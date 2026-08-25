import { getChatGPTUser } from "../../chatgpt-auth";
import { bindings, ensureSchema } from "../../lib/storage";
import { occupiedRoomSet } from "../../lib/occupancy";
import { configuredAvailableRooms, saveConfiguredAvailableRooms } from "../../lib/room-availability";
import { catalogBoard, publicRoomBoard } from "../../lib/rooms";

const noStore = { "Cache-Control": "no-store, max-age=0" };

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
    return Response.json(await roomResponse(), { headers: noStore });
  } catch {
    return Response.json({ updatedAt: Date.now(), source: "catalog", stale: true, rooms: catalogBoard() }, { headers: noStore });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as { availableRoomNumbers?: unknown };
  if (!Array.isArray(input.availableRoomNumbers)) {
    return Response.json({ error: "Available room numbers are required" }, { status: 400 });
  }

  const { DB } = bindings();
  await ensureSchema(DB!);
  await saveConfiguredAvailableRooms(DB!, input.availableRoomNumbers.map(String), user.email);
  return Response.json(await roomResponse(), { headers: noStore });
}

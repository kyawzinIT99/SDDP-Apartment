import assert from "node:assert/strict";
import test from "node:test";

import { initialAvailableRoomNumbers, initialOccupiedRoomNumbers, publicRoomBoard, roomCatalog } from "../app/lib/rooms.ts";

test("uses the exact staff-confirmed catalog and ten available rooms", () => {
  const board = publicRoomBoard(new Set(), true, new Set(initialAvailableRoomNumbers));
  assert.deepEqual(
    board.filter((room) => room.status === "available").map((room) => room.roomNumber),
    ["202", "203", "207", "301", "303", "305", "307", "312", "315", "405"],
  );
  assert.equal(board.find((room) => room.roomNumber === "201")?.status, "occupied");
  assert.deepEqual(roomCatalog.map((room) => room.roomNumber), [
    "101", "102", "103", "105", "106", "107",
    "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216",
    "301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316",
    "401", "402", "403", "404", "405", "406", "407", "408", "409", "411", "VIP1", "VIP2", "VIP3",
  ]);
  assert.equal(initialOccupiedRoomNumbers.length, roomCatalog.length - 10);
});

test("an active resident or deposit keeps a configured available room occupied", () => {
  const board = publicRoomBoard(new Set(["202"]), true, new Set(initialAvailableRoomNumbers));
  assert.equal(board.find((room) => room.roomNumber === "202")?.status, "occupied");
});

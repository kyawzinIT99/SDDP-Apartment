import assert from "node:assert/strict";
import test from "node:test";

import { initialAvailableRoomNumbers, initialOccupiedRoomNumbers, publicRoomBoard } from "../app/lib/rooms.ts";

test("uses the ten staff-confirmed occupied rooms for a new database", () => {
  const board = publicRoomBoard(new Set(), true, new Set(initialAvailableRoomNumbers));
  assert.deepEqual(
    board.filter((room) => room.status === "occupied").map((room) => room.roomNumber),
    ["202", "203", "207", "301", "303", "305", "307", "312", "315", "405"],
  );
  assert.equal(board.find((room) => room.roomNumber === "201")?.status, "available");
  assert.deepEqual(initialOccupiedRoomNumbers, ["202", "203", "207", "301", "303", "305", "307", "312", "315", "405"]);
});

test("an active resident or deposit keeps a configured available room occupied", () => {
  const board = publicRoomBoard(new Set(["201"]), true, new Set(initialAvailableRoomNumbers));
  assert.equal(board.find((room) => room.roomNumber === "201")?.status, "occupied");
});

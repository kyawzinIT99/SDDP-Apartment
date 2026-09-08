import assert from "node:assert/strict";
import test from "node:test";

import { catalogRoomFromValue, initialAvailableRoomNumbers, initialOccupiedRoomNumbers, publicRoomBoard, roomCatalog } from "../app/lib/rooms.ts";

test("uses the exact staff-confirmed catalog and no seed occupied rooms", () => {
  const board = publicRoomBoard(new Set(), true);
  assert.deepEqual(board.filter((room) => room.status === "occupied").map((room) => room.roomNumber), []);
  assert.equal(board.find((room) => room.roomNumber === "201")?.status, "available");
  assert.deepEqual(roomCatalog.map((room) => room.roomNumber), [
    "101", "102", "103", "105", "106", "107",
    "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216",
    "301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316",
    "401", "402", "403", "404", "405", "406", "407", "408", "409", "411", "VIP1", "VIP2", "VIP3",
  ]);
  assert.deepEqual(initialOccupiedRoomNumbers, []);
  assert.deepEqual(initialAvailableRoomNumbers, roomCatalog.map((room) => room.roomNumber));
});

test("reads a catalog room from a resident name when the room field is blank", () => {
  assert.equal(catalogRoomFromValue("", "405", "405"), "405");
  assert.equal(catalogRoomFromValue("", "315", "35"), "315");
  assert.equal(catalogRoomFromValue("", "Guest Name", "0942935296"), "");
});

test("an active resident or deposit occupies a room; empty rooms stay available", () => {
  const board = publicRoomBoard(new Set(["201"]), true);
  assert.equal(board.find((room) => room.roomNumber === "201")?.status, "occupied");
  assert.equal(board.find((room) => room.roomNumber === "202")?.status, "available");
});

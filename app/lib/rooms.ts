export type RoomDefinition = {
  roomNumber: string;
  floor: string;
  sortOrder: number;
};

function numberedFloor(floor: number, lastRoom: number): RoomDefinition[] {
  const firstRoom = floor * 100 + 1;
  return Array.from({ length: lastRoom - firstRoom + 1 }, (_, index) => ({
    roomNumber: String(firstRoom + index),
    floor: String(floor),
    sortOrder: firstRoom + index,
  }));
}

// Master inventory confirmed by SDDP staff. Any new room number stored in the
// resident database is appended by the public API.
export const roomCatalog: RoomDefinition[] = [
  { roomNumber: "101", floor: "1", sortOrder: 101 },
  { roomNumber: "102", floor: "1", sortOrder: 102 },
  { roomNumber: "103", floor: "1", sortOrder: 103 },
  { roomNumber: "105", floor: "1", sortOrder: 105 },
  { roomNumber: "106", floor: "1", sortOrder: 106 },
  { roomNumber: "107", floor: "1", sortOrder: 107 },
  ...numberedFloor(2, 216),
  ...numberedFloor(3, 316),
  ...numberedFloor(4, 409),
  { roomNumber: "411", floor: "4", sortOrder: 411 },
  { roomNumber: "VIP1", floor: "4", sortOrder: 4901 },
  { roomNumber: "VIP2", floor: "4", sortOrder: 4902 },
  { roomNumber: "VIP3", floor: "4", sortOrder: 4903 },
];

// Current available inventory confirmed by SDDP staff. This is used until the
// room-status editor or the resident workflow records a later change.
export const initialAvailableRoomNumbers = [
  "202", "203", "207", "301", "303", "305", "307", "312", "315", "405",
];
const initialAvailableRooms = new Set(initialAvailableRoomNumbers);
export const initialOccupiedRoomNumbers = roomCatalog
  .map((room) => room.roomNumber)
  .filter((roomNumber) => !initialAvailableRooms.has(roomNumber));

export function normalizeRoomNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  const digits = compact.match(/(?:ROOM|ห้อง)?(\d{3})$/);
  if (digits) return digits[1];
  const vip = compact.match(/^VIP[-_]?([123])$/);
  if (vip) return `VIP${vip[1]}`;
  return compact.slice(0, 20);
}

export function inferFloor(roomNumber: string): string {
  if (/^[1234]\d{2}$/.test(roomNumber)) return roomNumber[0];
  if (/^VIP[123]$/.test(roomNumber)) return "4";
  return "Other";
}

export type PublicRoomStatus = "available" | "occupied" | "unknown";
export type PublicRoom = { roomNumber: string; floor: string; status: PublicRoomStatus };

export function publicRoomBoard(occupied: Set<string>, connected: boolean, configuredAvailable?: Set<string>): PublicRoom[] {
  const masterNumbers = new Set(roomCatalog.map((room) => room.roomNumber));
  const extra = [...occupied]
    .filter((roomNumber) => !masterNumbers.has(roomNumber))
    .map((roomNumber, index) => ({ roomNumber, floor: inferFloor(roomNumber), sortOrder: 9000 + index }));
  return [...roomCatalog, ...extra]
    .sort((a, b) => a.floor.localeCompare(b.floor) || a.sortOrder - b.sortOrder)
    .map((room) => ({
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: connected
        ? (occupied.has(room.roomNumber) || (configuredAvailable && !configuredAvailable.has(room.roomNumber)) ? "occupied" : "available")
        : "unknown",
    }));
}

export function catalogBoard(): PublicRoom[] {
  return publicRoomBoard(new Set(), false);
}

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

// Master inventory transcribed from the supplied SDDP room drawing. Any new
// room number stored in the resident database is appended by the public API.
export const roomCatalog: RoomDefinition[] = [
  ...numberedFloor(2, 215),
  ...numberedFloor(3, 316),
  ...numberedFloor(4, 414),
  { roomNumber: "VIP1", floor: "4", sortOrder: 4901 },
  { roomNumber: "VIP2", floor: "4", sortOrder: 4902 },
];

export function normalizeRoomNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  const digits = compact.match(/(?:ROOM|ห้อง)?(\d{3})$/);
  if (digits) return digits[1];
  const vip = compact.match(/^VIP[-_]?([12])$/);
  if (vip) return `VIP${vip[1]}`;
  return compact.slice(0, 20);
}

export function inferFloor(roomNumber: string): string {
  if (/^[234]\d{2}$/.test(roomNumber)) return roomNumber[0];
  if (/^VIP[12]$/.test(roomNumber)) return "4";
  return "Other";
}

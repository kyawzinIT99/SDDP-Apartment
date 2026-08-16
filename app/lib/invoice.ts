export const ELECTRIC_RATE = 7;
export const WATER_RATE = 17;
export const LATE_FEE_PER_DAY = 100;
export const PAY_BY_DAY = 5;

export const invoiceLetterhead = {
  name: "SDDP Apartment",
  thaiAddress: "เลขที่ 8/18 หมู่ที่ 2 ถนนเชียงใหม่-สันกำแพง (สายเก่า) ตำบลต้นเปา อำเภอสันกำแพง จังหวัดเชียงใหม่ 50130",
  taxId: "0505560004656",
  phone: "064-5046997",
  notes: "หมายเหตุ โปรดชำระค่าเช่าภายในวันที่ 5 ของทุกเดือน หากเกินกำหนดจะถูกปรับวันละ 100 บาท",
};

const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type InvoiceRecord = {
  id: string;
  bookNumber: string;
  invoiceNumber: string;
  roomNumber: string;
  residentName: string;
  address: string;
  billingMonth: number;
  billingYear: string;
  issueDate: string;
  rentAmount: number;
  electricRate: number;
  electricPrev: number;
  electricCurr: number;
  electricUnits: number;
  electricAmount: number;
  waterRate: number;
  waterPrev: number;
  waterCurr: number;
  waterUnits: number;
  waterAmount: number;
  otherLabel: string;
  otherAmount: number;
  total: number;
  totalWords: string;
  createdAt: number;
};

export type InvoiceInput = {
  bookNumber?: string;
  invoiceNumber?: string;
  roomNumber?: string;
  residentName?: string;
  address?: string;
  billingMonth?: number;
  billingYear?: string;
  issueDate?: string;
  rentAmount?: number | string;
  electricRate?: number | string;
  electricPrev?: number | string;
  electricCurr?: number | string;
  waterRate?: number | string;
  waterPrev?: number | string;
  waterCurr?: number | string;
  otherLabel?: string;
  otherAmount?: number | string;
};

export function parseAmount(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const digits = (value ?? "").replace(/[^\d.]/g, "");
  return digits ? Number(digits) : 0;
}

export function usedUnits(previous: number, current: number) {
  if (!current && !previous) return 0;
  return Math.max(0, current - previous);
}

function underHundred(value: number) {
  if (value < 10) return ones[value];
  if (value < 20) return teens[value - 10];
  const rest = value % 10;
  return tens[Math.floor(value / 10)] + (rest ? `-${ones[rest]}` : "");
}

function underThousand(value: number) {
  if (value < 100) return underHundred(value);
  const rest = value % 100;
  return `${ones[Math.floor(value / 100)]} hundred${rest ? ` and ${underHundred(rest)}` : ""}`;
}

export function amountInEnglish(amount: number) {
  const value = Math.round(Math.max(0, amount));
  if (value === 0) return "Zero baht.";
  const thousand = Math.floor(value / 1000);
  const rest = value % 1000;
  let words = thousand ? `${underThousand(thousand)} thousand` : "";
  if (rest) words += `${words ? (rest < 100 ? " and " : " ") : ""}${underThousand(rest)}`;
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} baht.`;
}

export function money(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")}.--`;
}

export function padBook(value: number | string) {
  return String(parseAmount(value) || value).replace(/\D/g, "").padStart(3, "0").slice(-3) || "001";
}

export function padInvoiceNo(value: number | string) {
  return String(parseAmount(value) || value).replace(/\D/g, "").padStart(4, "0").slice(-4) || "0001";
}

export function billingLabel(month: number, year: string) {
  const name = monthNames[Math.min(12, Math.max(1, month)) - 1] ?? "Jan";
  return `${name}, ${year}`;
}

export function printDate(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function buildInvoice(input: InvoiceInput, fallback: { bookNumber: string; invoiceNumber: string; issueDate: string }): Omit<InvoiceRecord, "id" | "createdAt"> {
  const electricPrev = parseAmount(input.electricPrev);
  const electricCurr = parseAmount(input.electricCurr);
  const waterPrev = parseAmount(input.waterPrev);
  const waterCurr = parseAmount(input.waterCurr);
  const electricRate = parseAmount(input.electricRate) || ELECTRIC_RATE;
  const waterRate = parseAmount(input.waterRate) || WATER_RATE;
  const electricUnits = usedUnits(electricPrev, electricCurr);
  const waterUnits = usedUnits(waterPrev, waterCurr);
  const electricAmount = electricUnits * electricRate;
  const waterAmount = waterUnits * waterRate;
  const rentAmount = parseAmount(input.rentAmount);
  const otherAmount = parseAmount(input.otherAmount);
  const total = rentAmount + electricAmount + waterAmount + otherAmount;
  return {
    bookNumber: padBook(input.bookNumber || fallback.bookNumber),
    invoiceNumber: padInvoiceNo(input.invoiceNumber || fallback.invoiceNumber),
    roomNumber: (input.roomNumber ?? "").trim().slice(0, 20),
    residentName: (input.residentName ?? "").trim().slice(0, 160),
    address: (input.address ?? "").trim().slice(0, 200),
    billingMonth: Math.min(12, Math.max(1, Number(input.billingMonth) || 1)),
    billingYear: String(input.billingYear ?? "").replace(/\D/g, "").slice(0, 4),
    issueDate: input.issueDate || fallback.issueDate,
    rentAmount, electricRate, electricPrev, electricCurr, electricUnits, electricAmount,
    waterRate, waterPrev, waterCurr, waterUnits, waterAmount,
    otherLabel: (input.otherLabel ?? "").trim().slice(0, 80),
    otherAmount, total, totalWords: amountInEnglish(total),
  };
}

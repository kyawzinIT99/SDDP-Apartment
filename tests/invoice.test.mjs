import assert from "node:assert/strict";
import test from "node:test";
import { amountInEnglish, amountInThai, billingLabel, buildInvoice, money, printDate, usedUnits } from "../app/lib/invoice.ts";

test("matches the original SDDP invoice totals and English words", () => {
  const invoice = buildInvoice({
    residentName: "KYAW ZIN TUN",
    address: "MYANMAR",
    roomNumber: "308",
    billingMonth: 10,
    billingYear: "2025",
    issueDate: "2025-10-01",
    rentAmount: 4000,
    electricPrev: 8298,
    electricCurr: 8643,
    waterPrev: 371,
    waterCurr: 382,
  }, { bookNumber: "014", invoiceNumber: "0690", issueDate: "2025-10-01" });
  assert.equal(invoice.electricUnits, 345);
  assert.equal(invoice.electricAmount, 2415);
  assert.equal(invoice.waterUnits, 11);
  assert.equal(invoice.waterAmount, 187);
  assert.equal(invoice.total, 6602);
  assert.equal(invoice.totalWords, "Six thousand six hundred and two baht.");
  assert.equal(amountInThai(6602), "หกพันหกร้อยสองบาทถ้วน");
  assert.equal(amountInEnglish(6602), "Six thousand six hundred and two baht.");
  assert.equal(money(6602), "6,602.--");
  assert.equal(billingLabel(10, "2025"), "Oct, 2025");
  assert.equal(billingLabel(10, "2025", "th"), "ตุลาคม 2025");
  assert.equal(printDate("2025-10-01"), "01/10/2025");
});

test("lets staff type a 2026 billing year", () => {
  const invoice = buildInvoice({
    residentName: "Test Guest",
    roomNumber: "201",
    billingMonth: 8,
    billingYear: "2026",
    rentAmount: "4,000",
  }, { bookNumber: "014", invoiceNumber: "0691", issueDate: "2026-08-16" });
  assert.equal(invoice.billingYear, "2026");
  assert.equal(billingLabel(8, "2026"), "Aug, 2026");
  assert.equal(usedUnits(100, 90), 0);
});

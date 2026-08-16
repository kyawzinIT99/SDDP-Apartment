import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the SDDP public site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /SDDP Apartment/);
  assert.match(html, /Room to feel at home/);
  assert.match(html, /TM30 support/);
  assert.match(html, /ภาษา|ไทย/);
  assert.match(html, /မြန်မာ/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|BCC|PDF Myanmar/i);
});

test("keeps the public facts and automation endpoints in source", async () => {
  const [page, defaults, inquiryApi, residentApi, roomsApi, storage, admin, occupancy, crypto, typedDate, invoiceApi, invoiceSheet, n8nInquiry] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/site-defaults.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/inquiries/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/residents/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rooms/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/occupancy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/guest-crypto.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/typed-date.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/invoices/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/InvoiceSheet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../n8n/sddp-inquiry-alert.json", import.meta.url), "utf8"),
  ]);
  assert.match(defaults, /4,000/);
  assert.match(defaults, /094-293-5296/);
  assert.match(defaults, /Sddpapartment/);
  assert.match(defaults, /SDDP\.Apartment/);
  assert.match(page, /publicGallery/);
  assert.match(page, /Chat on Line/);
  assert.match(page, /line-official/);
  assert.doesNotMatch(page, /Chat on WhatsApp|wa\.me|wa-float/);
  assert.match(page, /Stay options/);
  assert.match(inquiryApi, /sddp\.inquiry\.created/);
  assert.match(inquiryApi, /room_unavailable/);
  assert.match(inquiryApi, /room_number/);
  assert.match(inquiryApi, /pipeline/);
  assert.match(page, /TypedDateField/);
  assert.match(admin, /TypedDateField/);
  assert.match(typedDate, /placeholder="YYYY"/);
  assert.match(typedDate, /inputMode="numeric"/);
  assert.doesNotMatch(page, /type="date"/);
  assert.doesNotMatch(admin, /type="date"/);
  assert.match(page, /occupiedPick/);
  assert.match(page, /pickRoom/);
  assert.match(page, /catalogBoard/);
  assert.match(page, /status !== "available"/);
  assert.match(residentApi, /encryptPassport/);
  assert.match(residentApi, /consentConfirmed/);
  assert.match(residentApi, /fromInquiryId/);
  assert.match(residentApi, /normalizeRoomNumber/);
  assert.match(crypto, /SHA-256/);
  assert.match(crypto, /tryDecodeBase64/);
  assert.match(residentApi, /Invalid character/);
  assert.match(occupancy, /SELECT DISTINCT room_number/);
  assert.doesNotMatch(occupancy, /full_name|passport|email|phone/);
  assert.match(roomsApi, /source: "database"/);
  assert.doesNotMatch(storage, /cloudflare:workers/);
  assert.match(storage, /nodeSqliteAvailable|nodeBindings/);
  assert.match(storage, /\/var\/data\/sddp\.sqlite/);
  assert.match(storage, /startsWith\("\/var\/data\/"\)/);
  assert.match(inquiryApi, /room_required/);
  assert.match(storage, /CREATE TABLE IF NOT EXISTS residents/);
  assert.match(admin, /Website content/);
  assert.match(admin, /Resident records/);
  assert.match(admin, /Guest pipeline/);
  assert.match(admin, /Render Starter is the host/);
  assert.match(admin, /Move in/);
  assert.match(admin, /Printable invoice|InvoiceDesk/);
  assert.match(storage, /CREATE TABLE IF NOT EXISTS invoices/);
  assert.match(invoiceApi, /buildInvoice/);
  assert.match(invoiceSheet, /brand-logo\.jpg/);
  assert.match(invoiceSheet, /invoiceCopy/);
  assert.match(invoiceSheet, /language/);
  assert.doesNotMatch(admin, /Existing VPS/);
  assert.match(n8nInquiry, /"name": "SDDP Inquiry Alert"/);
  assert.match(n8nInquiry, /sddp-inquiry-alert/);
  assert.match(n8nInquiry, /x-sddp-webhook-secret/);
  assert.doesNotMatch(n8nInquiry, /pdf-inquiry-alert|bcc-inquiry-alert|BCC Inquiry Alert|PDF Inquiry Alert/);
});

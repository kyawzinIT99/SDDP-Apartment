const raw = items[0].json;
const body = raw.body && typeof raw.body === "object" ? raw.body : raw;
const headers = raw.headers || {};
const headerSecret = headers["x-sddp-webhook-secret"] || headers["X-Sddp-Webhook-Secret"] || "";
const expected = $env.SDDP_N8N_WEBHOOK_SECRET || $env.N8N_WEBHOOK_SECRET || "";
if (!expected || headerSecret !== expected) {
  throw new Error("SDDP webhook secret was not accepted");
}

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

const lineId = String(body.lineId || $env.SDDP_LINE_ID || "SDDP.Apartment").replace(/^@/, "");
const bankName = body.bankName || $env.SDDP_BANK_NAME || "";
const bankAccountName = body.bankAccountName || $env.SDDP_BANK_ACCOUNT_NAME || "";
const bankAccountNumber = body.bankAccountNumber || $env.SDDP_BANK_ACCOUNT_NUMBER || "";
const bankPromptPay = body.bankPromptPay || $env.SDDP_BANK_PROMPTPAY || "";
const phone = body.phonePrimary || "094-293-5296";
const deposit = body.monthlyDeposit || "50% of first month";
const email = String(body.email || "").trim();
const name = body.name || "Guest";
const roomNumber = body.roomNumber || "—";
const stayType = body.stayType || "";
const arrivalDate = body.arrivalDate || "to be confirmed";
const guestNote = body.message || "";
const site = body.site || "https://sddp-apartment.onrender.com";

const bankRows = [
  bankName && ["Bank", bankName],
  bankAccountName && ["Account name", bankAccountName],
  bankAccountNumber && ["Account number", bankAccountNumber],
  bankPromptPay && ["PromptPay", bankPromptPay],
].filter(Boolean);

const bankHtml = bankRows.length
  ? bankRows.map(([label, value]) => `<tr><td style="padding:9px 0;color:#6b6560;font-size:13px;width:42%">${esc(label)}</td><td style="padding:9px 0;color:#1b1c1d;font-size:15px;font-weight:700;letter-spacing:.02em">${esc(value)}</td></tr>`).join("")
  : `<tr><td colspan="2" style="padding:9px 0;color:#6b6560;font-size:13px">Our team will confirm bank details. Please send the transfer slip to Line @${esc(lineId)}.</td></tr>`;

function letter(d) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3efe6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1b1c1d">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e7e1d5">
        <tr><td style="background:#1b1c1d;padding:22px 28px">
          <div style="font-size:11px;letter-spacing:.18em;color:#ffd94f;font-weight:800">SDDP APARTMENT</div>
          <div style="font-size:22px;color:#fff;font-weight:700;margin-top:6px">${esc(d.title)}</div>
          <div style="font-size:13px;color:#c8c4bb;margin-top:6px">San Kamphaeng, Chiang Mai</div>
        </td></tr>
        <tr><td style="padding:28px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7">Dear ${esc(name)},</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Thank you for your inquiry. We have received your request and our team will follow up shortly.</p>
          <table role="presentation" width="100%" style="background:#f7f3eb;border-radius:12px;padding:4px 18px;margin:0 0 22px">
            <tr><td style="padding:10px 0;color:#6b6560;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Requested room</td><td style="padding:10px 0;text-align:right;font-weight:800;font-size:16px">${esc(roomNumber)}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #e7e1d5;color:#6b6560;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Stay type</td><td style="padding:10px 0;border-top:1px solid #e7e1d5;text-align:right;font-weight:700">${esc(stayType || "—")}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #e7e1d5;color:#6b6560;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Arrival</td><td style="padding:10px 0;border-top:1px solid #e7e1d5;text-align:right;font-weight:700">${esc(arrivalDate)}</td></tr>
          </table>
          <div style="border-left:4px solid #ee302b;padding:4px 0 4px 14px;margin:0 0 22px">
            <div style="font-size:12px;letter-spacing:.12em;font-weight:800;color:#ee302b">RESERVATION POLICY</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.7">A <strong>50% deposit</strong> (${esc(deposit)}) is required to reserve this room. Standard rooms: <strong>฿2,000</strong>. VIP rooms: <strong>฿4,000</strong>.</p>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.7">After the deposit is confirmed, the room is reserved and held for you. <strong>If you do not arrive, the deposit is not refunded.</strong></p>
          </div>
          <div style="font-size:12px;letter-spacing:.12em;font-weight:800;color:#1b1c1d;margin-bottom:8px">BANK TRANSFER</div>
          <table role="presentation" width="100%" style="margin:0 0 22px">${bankHtml}</table>
          <div style="background:#06c755;color:#fff;border-radius:12px;padding:16px 18px;margin:0 0 22px">
            <div style="font-size:12px;letter-spacing:.12em;font-weight:800">SEND YOUR TRANSFER SLIP</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.6">After transferring, send the payment slip to our Line account <strong>@${esc(lineId)}</strong>. The room is reserved only after we confirm the slip.</p>
          </div>
          ${guestNote ? `<p style="margin:0 0 18px;font-size:13px;color:#6b6560;line-height:1.6"><strong>Your note:</strong> ${esc(guestNote)}</p>` : ""}
          <p style="margin:0;font-size:14px;line-height:1.7">Kind regards,<br><strong>SDDP Apartment</strong><br>${esc(phone)}</p>
        </td></tr>
        <tr><td style="background:#f7f3eb;padding:16px 28px;font-size:11px;color:#8a847c;line-height:1.6">8/18 Moo 2, Ton Pao, San Kamphaeng, Chiang Mai 50130 · This is an automated reply to your website inquiry.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const guestHtml = letter({ title: "Your inquiry and deposit details" });
const staffHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1b1c1d;background:#f7f3eb;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #e7e1d5">
    <div style="font-size:11px;letter-spacing:.16em;color:#ee302b;font-weight:800">NEW WEBSITE INQUIRY</div>
    <h2 style="margin:8px 0 16px">${esc(name)} · Room ${esc(roomNumber)}</h2>
    <p><strong>Email:</strong> ${esc(email || "—")}<br><strong>Phone:</strong> ${esc(body.phone || "—")}<br><strong>Stay:</strong> ${esc(stayType)}<br><strong>Arrival:</strong> ${esc(arrivalDate)}<br><strong>Locale:</strong> ${esc(body.locale || "")}</p>
    <p>${esc(guestNote || "No guest note")}</p>
    <p>Guest auto-email ${email ? "sent" : "skipped (no email)"}. After 50% deposit + Line slip, mark <strong>Deposit ✓</strong> in admin to hold the room.</p>
    <p><a href="${esc(site)}/admin">Open admin</a></p>
  </div>
</body></html>`;

return [{
  json: {
    email,
    name,
    roomNumber,
    hasGuestEmail: Boolean(email && email.includes("@")),
    guestHtml,
    staffHtml,
    site,
  },
}];

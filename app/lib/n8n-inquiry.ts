import { request as httpsRequest } from "node:https";
import { URL } from "node:url";
import { defaultSiteSettings, type SiteSettings } from "./site-defaults";
import { bindings } from "./storage";

export const N8N_INQUIRY_WEBHOOK = "https://n8n-al8a.srv1707349.hstgr.cloud/webhook/sddp-inquiry-alert";

export type InquiryMailRecord = {
  id: string; name: string; phone: string; email: string; channel: string; stayType: string;
  roomNumber: string; arrivalDate: string; message: string; locale: string; createdAt: number;
};

function postJson(urlString: string, body: unknown): Promise<{ status: number; text: string }> {
  const url = new URL(urlString);
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = httpsRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") }));
    });
    req.setTimeout(12000, () => req.destroy(new Error("n8n webhook timed out")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function notifyInquiryN8n(record: InquiryMailRecord) {
  const runtime = bindings();
  const row = await runtime.DB!.prepare("SELECT value FROM site_settings WHERE id = ?").bind("public").first<{ value: string }>();
  const saved = row ? JSON.parse(row.value) as Partial<SiteSettings> : {};
  const site = { ...defaultSiteSettings, ...saved };
  const payload = {
    event: "sddp.inquiry.created",
    ...record,
    email: record.email,
    lineId: site.lineId,
    phonePrimary: site.phonePrimary,
    bankName: site.bankName,
    bankAccountName: site.bankAccountName,
    bankAccountNumber: site.bankAccountNumber,
    bankPromptPay: site.bankPromptPay,
    monthlyPrice: site.monthlyPrice,
    monthlyDeposit: site.monthlyDeposit,
    site: "https://sddp-apartment.onrender.com",
  };
  const result = await postJson(N8N_INQUIRY_WEBHOOK, payload);
  if (result.status < 200 || result.status >= 300) {
    console.error("SDDP n8n inquiry webhook failed", result.status, result.text.slice(0, 300));
    return false;
  }
  return true;
}

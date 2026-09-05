import { defaultSiteSettings, type SiteSettings } from "./site-defaults";
import { bindings } from "./storage";

export const N8N_INQUIRY_WEBHOOK = "https://n8n-al8a.srv1707349.hstgr.cloud/webhook/sddp-inquiry-alert";

export type InquiryMailRecord = {
  id: string; name: string; phone: string; email: string; channel: string; stayType: string;
  roomNumber: string; arrivalDate: string; message: string; locale: string; createdAt: number;
};

export type InquiryMailResult = { routed: boolean; error?: string };

export async function notifyInquiryN8n(record: InquiryMailRecord): Promise<InquiryMailResult> {
  const runtime = bindings();
  const url = (runtime.N8N_INQUIRY_WEBHOOK || N8N_INQUIRY_WEBHOOK).trim();
  if (!url) return { routed: false, error: "n8n webhook is not configured" };

  const row = await runtime.DB!.prepare("SELECT value FROM site_settings WHERE id = ?").bind("public").first<{ value: string }>();
  const saved = row ? JSON.parse(row.value) as Partial<SiteSettings> : {};
  const site = { ...defaultSiteSettings, ...saved };
  const secret = runtime.N8N_WEBHOOK_SECRET?.trim();
  const payload = {
    event: "sddp.inquiry.created",
    ...record,
    email: record.email,
    guestEmail: record.email,
    staffEmail: "sddpapartment@gmail.com",
    alertEmail: "sddpapartment@gmail.com",
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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SDDP-Apartment/1.0",
        ...(secret ? { "x-sddp-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("SDDP n8n inquiry webhook failed", response.status, text.slice(0, 300));
      return { routed: false, error: `n8n HTTP ${response.status}` };
    }
    return { routed: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "n8n fetch failed";
    console.error("SDDP n8n inquiry webhook error", error);
    return { routed: false, error: message };
  }
}

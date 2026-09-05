import { defaultSiteSettings, type SiteSettings } from "./site-defaults";
import { bindings } from "./storage";

export const N8N_INQUIRY_WEBHOOK = "https://n8n-al8a.srv1707349.hstgr.cloud/webhook/sddp-inquiry-alert";

export type InquiryMailRecord = {
  id: string; name: string; phone: string; email: string; channel: string; stayType: string;
  roomNumber: string; arrivalDate: string; message: string; locale: string; createdAt: number;
};

export type InquiryMailResult = { routed: boolean; error?: string };

type NodeHttps = {
  request: (
    options: Record<string, unknown>,
    callback: (res: { statusCode?: number; on: (event: string, fn: (chunk?: Buffer | string) => void) => void }) => void,
  ) => {
    setTimeout: (ms: number, fn: () => void) => void;
    on: (event: string, fn: (err: Error) => void) => void;
    write: (body: string) => void;
    end: () => void;
    destroy: (err?: Error) => void;
  };
};

function errorText(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const cause = "cause" in error ? error.cause : undefined;
  const extra = cause instanceof Error ? cause.message : cause ? String(cause) : "";
  return extra ? `${error.message}: ${extra}` : error.message;
}

function loadNodeHttps(): NodeHttps | undefined {
  try {
    const loader = (process as NodeJS.Process & { getBuiltinModule?: (name: string) => NodeHttps }).getBuiltinModule;
    if (typeof loader !== "function") return undefined;
    return loader("node:https");
  } catch {
    return undefined;
  }
}

function postJsonNode(urlString: string, body: unknown, secret?: string): Promise<{ status: number; text: string }> {
  const https = loadNodeHttps();
  if (!https) return Promise.reject(new Error("node:https is not available"));
  const url = new URL(urlString);
  const payload = JSON.stringify(body);
  const bytes = typeof Buffer === "undefined" ? new TextEncoder().encode(payload) : Buffer.from(payload);
  return new Promise((resolve, reject) => {
    const req = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(bytes.byteLength),
        "user-agent": "SDDP-Apartment/1.0",
        ...(secret ? { "x-sddp-webhook-secret": secret } : {}),
      },
    }, (res) => {
      const chunks: string[] = [];
      res.on("data", (chunk) => chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8")));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text: chunks.join("") }));
    });
    req.setTimeout(20_000, () => req.destroy(new Error("n8n webhook timed out")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function postJsonFetch(urlString: string, body: unknown, secret?: string) {
  const response = await fetch(urlString, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SDDP-Apartment/1.0",
      ...(secret ? { "x-sddp-webhook-secret": secret } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text().catch(() => "");
  return { status: response.status, text };
}

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
    const result = loadNodeHttps()
      ? await postJsonNode(url, payload, secret)
      : await postJsonFetch(url, payload, secret);
    if (result.status < 200 || result.status >= 300) {
      console.error("SDDP n8n inquiry webhook failed", result.status, result.text.slice(0, 300));
      return { routed: false, error: `n8n HTTP ${result.status}` };
    }
    return { routed: true };
  } catch (error) {
    console.error("SDDP n8n inquiry webhook error", error);
    return { routed: false, error: errorText(error) };
  }
}

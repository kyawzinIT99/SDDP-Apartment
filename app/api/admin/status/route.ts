import { getChatGPTUser } from "../../../chatgpt-auth";
import { adminPasswordConfigured } from "../../../lib/admin-auth";
import { bindings } from "../../../lib/storage";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const runtime = bindings();
  return Response.json({
    n8nConfigured: Boolean(runtime.N8N_INQUIRY_WEBHOOK && runtime.N8N_WEBHOOK_SECRET),
    passwordAuth: adminPasswordConfigured(),
    hosting: process.env.SDDP_DB_PATH || process.env.RENDER ? "render-sqlite" : "cloudflare-d1",
    vpsLater: true,
  });
}

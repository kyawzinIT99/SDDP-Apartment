import { getChatGPTUser } from "../../chatgpt-auth";
import { defaultSiteSettings, type SiteSettings } from "../../lib/site-defaults";
import { bindings, ensureSchema } from "../../lib/storage";

export async function GET() {
  try {
    const { DB } = bindings(); await ensureSchema(DB!);
    const row = await DB!.prepare("SELECT value FROM site_settings WHERE id = ?").bind("public").first<{ value: string }>();
    const saved = row ? JSON.parse(row.value) as Partial<SiteSettings> : {};
    if (saved.mapUrl === "https://goo.gl/maps/w8Dt91axwKPt9xgRA") saved.mapUrl = defaultSiteSettings.mapUrl;
    return Response.json({ ...defaultSiteSettings, ...saved, copy: saved.copy ?? {} });
  } catch { return Response.json(defaultSiteSettings); }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const input = await request.json() as Partial<SiteSettings>;
  const settings = { ...defaultSiteSettings, ...input, copy: input.copy ?? {} };
  const { DB } = bindings(); await ensureSchema(DB!);
  await DB!.prepare("INSERT INTO site_settings (id, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
    .bind("public", JSON.stringify(settings), Date.now(), user.email).run();
  return Response.json({ ok: true, settings });
}

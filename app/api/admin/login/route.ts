import { createAdminCookie, hashPassword, passwordMatches, type AdminRole } from "../../../lib/admin-auth";
import { bindings, ensureSchema } from "../../../lib/storage";

export async function POST(request: Request) {
  const input = await request.json() as { username?: string; password?: string };
  const password = input.password ?? "";
  const username = (input.username ?? "").trim().toLowerCase();
  const secure = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol).includes("https");

  // Try named admin_users table first
  try {
    const { DB } = bindings();
    await ensureSchema(DB!);
    if (username) {
      const hash = await hashPassword(password);
      const row = await DB!.prepare(
        "SELECT id, username, display_name AS displayName, role FROM admin_users WHERE username = ? AND active = 1"
      ).bind(username).first<{ id: string; username: string; displayName: string; role: AdminRole }>();
      if (row) {
        const storedHash = await DB!.prepare("SELECT password_hash FROM admin_users WHERE id = ?")
          .bind(row.id).first<{ password_hash: string }>();
        if (storedHash?.password_hash === hash) {
          const cookie = await createAdminCookie(row.id, `${row.username}@sddp.local`, row.displayName, row.role, secure);
          return new Response(JSON.stringify({ ok: true }), {
            status: 200, headers: { "content-type": "application/json", "set-cookie": cookie },
          });
        }
        return Response.json({ error: "That password is not correct" }, { status: 401 });
      }
    }
  } catch { /* fall through to env password */ }

  // Fall back to single ADMIN_PASSWORD (owner login, username can be anything or empty)
  if (!passwordMatches(password)) {
    return Response.json({ error: "That password is not correct" }, { status: 401 });
  }
  const cookie = await createAdminCookie("sddp-owner", "owner@sddp.local", "SDDP Owner", "owner", secure);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { "content-type": "application/json", "set-cookie": cookie },
  });
}

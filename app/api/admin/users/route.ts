import { getChatGPTUser } from "../../../chatgpt-auth";
import { hashPassword, type AdminRole } from "../../../lib/admin-auth";
import { bindings, ensureSchema } from "../../../lib/storage";

type AdminUserRow = { id: string; username: string; displayName: string; role: AdminRole; active: number; createdAt: number; createdBy: string };

async function ownerOnly() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const session = user as unknown as { role?: AdminRole };
  if (session.role && session.role !== "owner") return null;
  return user;
}

export async function GET() {
  const user = await ownerOnly();
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const rows = await DB!.prepare(
    "SELECT id, username, display_name AS displayName, role, active, created_at AS createdAt, created_by AS createdBy FROM admin_users ORDER BY created_at ASC"
  ).all<AdminUserRow>();
  return Response.json(rows.results ?? []);
}

export async function POST(request: Request) {
  const user = await ownerOnly();
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const { username, displayName, role, password } = await request.json() as { username?: string; displayName?: string; role?: string; password?: string };
  if (!username?.trim()) return Response.json({ error: "Username is required" }, { status: 400 });
  if (!password || password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  if (!["owner", "admin"].includes(role ?? "")) return Response.json({ error: "Role must be owner or admin" }, { status: 400 });
  const { DB } = bindings(); await ensureSchema(DB!);
  const exists = await DB!.prepare("SELECT id FROM admin_users WHERE username = ?").bind(username.trim().toLowerCase()).first();
  if (exists) return Response.json({ error: "Username already exists" }, { status: 409 });
  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  await DB!.prepare(
    "INSERT INTO admin_users (id, username, display_name, role, password_hash, active, created_at, created_by) VALUES (?,?,?,?,?,1,?,?)"
  ).bind(id, username.trim().toLowerCase(), displayName?.trim() || username.trim(), role, hash, Date.now(), user.email).run();
  return Response.json({ ok: true, id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await ownerOnly();
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const { id, active, displayName, password } = await request.json() as { id?: string; active?: boolean; displayName?: string; password?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { DB } = bindings(); await ensureSchema(DB!);
  if (typeof active === "boolean") {
    await DB!.prepare("UPDATE admin_users SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
  }
  if (displayName?.trim()) {
    await DB!.prepare("UPDATE admin_users SET display_name = ? WHERE id = ?").bind(displayName.trim(), id).run();
  }
  if (password && password.length >= 6) {
    const hash = await hashPassword(password);
    await DB!.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").bind(hash, id).run();
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await ownerOnly();
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const { id } = await request.json() as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { DB } = bindings(); await ensureSchema(DB!);
  await DB!.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}

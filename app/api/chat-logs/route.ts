import { bindings, ensureSchema } from "../../lib/storage";
import { getChatGPTUser } from "../../chatgpt-auth";

// Public POST — any visitor can save their session
export async function POST(request: Request) {
  try {
    const { id, lang, messages, question_count } = await request.json();
    if (!id || !Array.isArray(messages)) return Response.json({ error: "Invalid payload" }, { status: 400 });

    const userAgent = request.headers.get("user-agent") ?? "";
    const now = Date.now();
    const { DB } = bindings();
    await ensureSchema(DB!);

    const existing = await DB!.prepare("SELECT id FROM chat_logs WHERE id = ?").bind(id).first<{ id: string }>();
    if (existing) {
      // Update existing session (more messages added)
      await DB!.prepare(
        "UPDATE chat_logs SET messages = ?, question_count = ?, last_seen_at = ? WHERE id = ?"
      ).bind(JSON.stringify(messages), question_count ?? 0, now, id).run();
    } else {
      await DB!.prepare(
        "INSERT INTO chat_logs (id, lang, messages, question_count, user_agent, created_at, last_seen_at) VALUES (?,?,?,?,?,?,?)"
      ).bind(id, lang ?? "en", JSON.stringify(messages), question_count ?? 0, userAgent.slice(0, 200), now, now).run();
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat log save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

// Admin-only GET
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { DB } = bindings();
    await ensureSchema(DB!);

    const rows = await DB!.prepare(
      "SELECT id, lang, messages, question_count, user_agent, created_at, last_seen_at FROM chat_logs ORDER BY created_at DESC LIMIT 200"
    ).all<{ id: string; lang: string; messages: string; question_count: number; user_agent: string; created_at: number; last_seen_at: number }>();

    const logs = (rows.results ?? []).map((row) => ({
      ...row,
      messages: (() => { try { return JSON.parse(row.messages); } catch { return []; } })(),
    }));

    return Response.json(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat log fetch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

import { createAdminCookie, passwordMatches } from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const input = await request.json() as { password?: string };
  if (!passwordMatches(input.password ?? "")) {
    return Response.json({ error: "That password is not correct" }, { status: 401 });
  }
  const secure = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol).includes("https");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": await createAdminCookie(secure) },
  });
}

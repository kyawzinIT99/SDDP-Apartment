import { headers } from "next/headers";

export type AdminRole = "owner" | "admin";
export type AdminSession = { userId: string; email: string; displayName: string; fullName: string; role: AdminRole };

const COOKIE = "sddp_admin";
const WEEK = 60 * 60 * 24 * 7;

function env(name: string) {
  try { return typeof process !== "undefined" ? process.env[name] : undefined; } catch { return undefined; }
}

export function adminPasswordConfigured() { return Boolean(env("ADMIN_PASSWORD")); }
function sessionSecret() { return env("ADMIN_SESSION_SECRET") || env("ADMIN_PASSWORD") || ""; }
function toHex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

async function hmac(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session secret is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = env("ADMIN_SESSION_SECRET") || "sddp-salt";
  const data = new TextEncoder().encode(salt + "::" + password);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookie(header: string | null) {
  if (!header) return "";
  const match = header.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : "";
}

export async function readAdminSession(cookieHeader?: string | null): Promise<AdminSession | null> {
  const token = parseCookie(cookieHeader ?? (await headers()).get("cookie"));
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !sessionSecret()) return null;
  const expected = await hmac(payload);
  if (!safeEqual(signature, expected)) return null;
  try {
    const s = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { userId: string; email: string; displayName: string; role?: AdminRole; exp: number };
    if (!s.exp || s.exp < Date.now()) return null;
    return { userId: s.userId, email: s.email, displayName: s.displayName, fullName: s.displayName, role: s.role ?? "owner" };
  } catch { return null; }
}

export async function createAdminCookie(userId: string, email: string, displayName: string, role: AdminRole, secure: boolean) {
  const payload = btoa(JSON.stringify({ userId, email, displayName, role, exp: Date.now() + WEEK * 1000 }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const token = `${payload}.${await hmac(payload)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WEEK}${secure ? "; Secure" : ""}`;
}

export function clearAdminCookie() { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`; }

export function passwordMatches(password: string) {
  const expected = env("ADMIN_PASSWORD") ?? "";
  return Boolean(expected) && safeEqual(password, expected);
}

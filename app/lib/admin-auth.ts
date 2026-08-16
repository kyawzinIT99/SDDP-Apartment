import { headers } from "next/headers";

const COOKIE = "sddp_admin";
const WEEK = 60 * 60 * 24 * 7;

function env(name: string) {
  try {
    return typeof process !== "undefined" ? process.env[name] : undefined;
  } catch {
    return undefined;
  }
}

export function adminPasswordConfigured() {
  return Boolean(env("ADMIN_PASSWORD"));
}

function sessionSecret() {
  return env("ADMIN_SESSION_SECRET") || env("ADMIN_PASSWORD") || "";
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session secret is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

function parseCookie(header: string | null) {
  if (!header) return "";
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : "";
}

export async function readAdminSession(cookieHeader?: string | null) {
  const token = parseCookie(cookieHeader ?? (await headers()).get("cookie"));
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !sessionSecret()) return null;
  const expected = await hmac(payload);
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { userId: string; email: string; displayName: string; exp: number };
    if (!session.exp || session.exp < Date.now()) return null;
    return { userId: session.userId, email: session.email, displayName: session.displayName, fullName: session.displayName };
  } catch {
    return null;
  }
}

export async function createAdminCookie(secure: boolean) {
  const payload = btoa(JSON.stringify({
    userId: "sddp-admin",
    email: "admin@sddp.apartment",
    displayName: "SDDP Administrator",
    exp: Date.now() + WEEK * 1000,
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const token = `${payload}.${await hmac(payload)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WEEK}${secure ? "; Secure" : ""}`;
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function passwordMatches(password: string) {
  const expected = env("ADMIN_PASSWORD") ?? "";
  return Boolean(expected) && safeEqual(password, expected);
}

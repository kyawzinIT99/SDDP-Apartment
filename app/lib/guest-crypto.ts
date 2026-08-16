function normalizeBase64(value: string) {
  const cleaned = value.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  return cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
}

function tryDecodeBase64(value: string): Uint8Array | null {
  try {
    const normalized = normalizeBase64(value);
    if (typeof Buffer !== "undefined") {
      const raw = Uint8Array.from(Buffer.from(normalized, "base64"));
      return raw.byteLength ? raw : null;
    }
    const decoded = atob(normalized);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

async function keyBytes(secret: string): Promise<Uint8Array> {
  const trimmed = secret.trim();
  if (!trimmed) throw new Error("Guest encryption key is missing");
  const decoded = tryDecodeBase64(trimmed);
  if (decoded && decoded.byteLength === 32) return decoded;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(trimmed)));
}

async function passportKey(secret: string, usage: KeyUsage[]) {
  const raw = await keyBytes(secret);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, usage);
}

export async function encryptPassport(passportNumber: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await passportKey(secret, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(passportNumber));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

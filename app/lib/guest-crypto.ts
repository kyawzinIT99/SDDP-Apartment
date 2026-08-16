function toBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromBase64(value: string) {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function passportKey(secret: string, usage: KeyUsage[]) {
  const raw = fromBase64(secret);
  if (raw.byteLength !== 32) throw new Error("Guest encryption key must contain 32 bytes");
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, usage);
}

export async function encryptPassport(passportNumber: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await passportKey(secret, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(passportNumber));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

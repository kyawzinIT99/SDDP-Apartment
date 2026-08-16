import assert from "node:assert/strict";
import test from "node:test";
import { encryptPassport } from "../app/lib/guest-crypto.ts";

test("encrypts a passport with a 32-byte base64 key", async () => {
  const secret = Buffer.alloc(32, 7).toString("base64");
  const value = await encryptPassport("AB1234567", secret);
  assert.match(value, /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
});

test("encrypts a passport when the Render key is not valid base64", async () => {
  const value = await encryptPassport("AB1234567", "not a valid base64 key!!\n");
  assert.match(value, /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
});

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const algorithm = "aes-256-gcm";

function getKey(): Buffer {
  const base64 = process.env.TASKS_ENCRYPTION_KEY;
  if (!base64) throw new Error("Missing TASKS_ENCRYPTION_KEY");
  const key = Buffer.from(base64, "base64");
  if (key.length !== 32) throw new Error("TASKS_ENCRYPTION_KEY must be 32 bytes base64");
  return key;
}

export type CipherBundle = {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
};

export function encryptString(plaintext: string): CipherBundle {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptString(bundle: CipherBundle): string {
  const iv = Buffer.from(bundle.iv, "base64");
  const decipher = createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(Buffer.from(bundle.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bundle.ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

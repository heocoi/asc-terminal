import { SignJWT, importPKCS8 } from "jose";

let cachedToken: { token: string; expiresAt: number } | null = null;

function getPrivateKeyPem(): string {
  const key = process.env.ASC_PRIVATE_KEY;
  if (!key) throw new Error("ASC_PRIVATE_KEY not set");
  // Support base64-encoded .p8 content
  if (!key.includes("BEGIN PRIVATE KEY")) {
    return Buffer.from(key, "base64").toString("utf-8");
  }
  return key;
}

export async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const keyId = process.env.ASC_KEY_ID;
  const issuerId = process.env.ASC_ISSUER_ID;
  if (!keyId || !issuerId) {
    throw new Error("ASC_KEY_ID and ASC_ISSUER_ID must be set");
  }

  const pem = getPrivateKeyPem();
  const privateKey = await importPKCS8(pem, "ES256");

  const expiresAt = now + 15 * 60; // 15 min (max 20)
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setAudience("appstoreconnect-v1")
    .sign(privateKey);

  cachedToken = { token, expiresAt };
  return token;
}

import crypto from "node:crypto";

function getOtpSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "auracare-local-dev-secret-change-in-production-2026"
  );
}

interface EmailOtpPayload {
  email: string;
  code: string;
  exp: number;
}

interface VerifiedEmailPayload {
  email: string;
  verifiedAt: number;
  exp: number;
}

interface SupabaseOtpChallengePayload {
  provider: "supabase";
  email: string;
  exp: number;
}

export function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function signEmailOtpChallenge(params: {
  email: string;
  code: string;
  ttlMs?: number;
}): string {
  const payload: EmailOtpPayload = {
    email: params.email.trim().toLowerCase(),
    code: params.code.trim(),
    exp: Date.now() + (params.ttlMs ?? 10 * 60 * 1000)
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(`otp:${encoded}`)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyEmailOtpChallenge(params: {
  token: string;
  email: string;
  code: string;
}): boolean {
  const parts = params.token.split(".");
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(`otp:${encoded}`)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as EmailOtpPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return false;
    if (parsed.email !== params.email.trim().toLowerCase()) return false;

    const codeBuf = Buffer.from(params.code.trim());
    const expectedCodeBuf = Buffer.from(parsed.code);
    if (codeBuf.length !== expectedCodeBuf.length) return false;
    return crypto.timingSafeEqual(codeBuf, expectedCodeBuf);
  } catch {
    return false;
  }
}

export function signVerifiedEmailProof(email: string): string {
  const now = Date.now();
  const payload: VerifiedEmailPayload = {
    email: email.trim().toLowerCase(),
    verifiedAt: now,
    exp: now + 60 * 60 * 1000
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(`verified:${encoded}`)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function signSupabaseOtpChallenge(params: {
  email: string;
  ttlMs?: number;
}): string {
  const payload: SupabaseOtpChallengePayload = {
    provider: "supabase",
    email: params.email.trim().toLowerCase(),
    exp: Date.now() + (params.ttlMs ?? 15 * 60 * 1000)
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(`sbotp:${encoded}`)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySupabaseOtpChallengeToken(params: {
  token: string;
  email: string;
}): boolean {
  const parts = params.token.split(".");
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(`sbotp:${encoded}`)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SupabaseOtpChallengePayload;
    if (parsed.provider !== "supabase") return false;
    if (!parsed.exp || parsed.exp < Date.now()) return false;
    return parsed.email === params.email.trim().toLowerCase();
  } catch {
    return false;
  }
}

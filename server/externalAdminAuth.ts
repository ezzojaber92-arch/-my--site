import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";

export const EXTERNAL_ADMIN_COOKIE = "zomool_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const scrypt = promisify(scryptCallback);
const ACCOUNT_PASSWORD_PREFIX = "scrypt";
const ACCOUNT_PASSWORD_KEY_LENGTH = 64;

type AttemptState = { failed: number; windowStartedAt: number; lockedUntil: number };
const attempts = new Map<string, AttemptState>();

function secretKey() {
  const configuredSecret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "";
  if (configuredSecret.length < 12) throw new Error("No server secret is configured for admin sessions");
  const derivedSecret = createHash("sha256")
    .update(`zomool-reserve-admin-session:${configuredSecret}`)
    .digest("hex");
  return new TextEncoder().encode(derivedSecret);
}

function configuredPassword() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < 12) throw new Error("ADMIN_PASSWORD is not configured");
  return password;
}

function sameSecret(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function clientKey(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const address = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.ip || "unknown";
  return createHash("sha256").update(address || "unknown").digest("hex").slice(0, 24);
}

export function assertLoginAllowed(req: Request, now = Date.now()) {
  const key = clientKey(req);
  const state = attempts.get(key);
  if (!state) return;
  if (state.lockedUntil > now) {
    throw new Error("ADMIN_LOGIN_RATE_LIMITED");
  }
  if (now - state.windowStartedAt >= RATE_WINDOW_MS) attempts.delete(key);
}

export function recordLoginFailure(req: Request, now = Date.now()) {
  const key = clientKey(req);
  const current = attempts.get(key);
  const state = !current || now - current.windowStartedAt >= RATE_WINDOW_MS
    ? { failed: 0, windowStartedAt: now, lockedUntil: 0 }
    : current;
  state.failed += 1;
  if (state.failed >= MAX_ATTEMPTS) state.lockedUntil = now + LOCKOUT_MS;
  attempts.set(key, state);
}

export function clearLoginFailures(req: Request) {
  attempts.delete(clientKey(req));
}

export function resetLoginRateLimitForTests() {
  attempts.clear();
}

export function verifyAdminPassword(password: string) {
  return sameSecret(password, configuredPassword());
}

export async function hashAdminAccountPassword(password: string) {
  if (password.length < 8) throw new Error("ADMIN_ACCOUNT_PASSWORD_TOO_SHORT");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, ACCOUNT_PASSWORD_KEY_LENGTH) as Buffer;
  return `${ACCOUNT_PASSWORD_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyAdminAccountPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [prefix, salt, encodedKey] = storedHash.split("$");
  if (prefix !== ACCOUNT_PASSWORD_PREFIX || !salt || !encodedKey) return false;
  try {
    const expected = Buffer.from(encodedKey, "hex");
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createExternalAdminSession(email?: string | null) {
  return new SignJWT({ kind: "external-admin", ...(email ? { email } : {}) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("zomool-reserve-admin")
    .setAudience("zomool-reserve")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyExternalAdminSession(token: string | undefined | null) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "zomool-reserve-admin",
      audience: "zomool-reserve",
    });
    return payload.kind === "external-admin";
  } catch {
    return false;
  }
}

export async function hasExternalAdminSession(req: Request) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return verifyExternalAdminSession(cookies[EXTERNAL_ADMIN_COOKIE]);
}

export async function externalAdminSessionEmail(req: Request) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const token = cookies[EXTERNAL_ADMIN_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"], issuer: "zomool-reserve-admin", audience: "zomool-reserve" });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function externalAdminUser(email: string | null = null) {
  const now = new Date();
  return {
    id: -1,
    openId: "external-admin",
    name: "إدارة المحمية",
    email,
    loginMethod: email ? "external-email-password" : "external-password",
    role: "admin" as const,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export function externalAdminCookieOptions(req: Request) {
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || forwardedProtocol === "https" || req.protocol === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    // Express cookie maxAge is milliseconds; the JWT lifetime above is seconds.
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

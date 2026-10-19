import "server-only";

import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-portfolio_admin"
    : "portfolio_admin";

type SessionPayload = { exp: number; sid: string };

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createSessionToken() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    sid: randomBytes(18).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySessionToken(token?: string) {
  if (!token) return false;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra || !constantTimeEqual(signature, sign(encoded))) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    return (
      typeof payload.sid === "string" &&
      payload.sid.length >= 20 &&
      Number.isInteger(payload.exp) &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  try {
    const store = await cookies();
    return verifySessionToken(store.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyAdminPassword(password: string) {
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded) throw new Error("ADMIN_PASSWORD_HASH is not configured.");
  // Colons are safe in .env files. Keep accepting the former "$" format for
  // deployments where those characters were escaped explicitly.
  const separator = encoded.includes(":") ? ":" : "$";
  const [algorithm, saltValue, expectedValue, extra] = encoded.split(separator);
  if (algorithm !== "scrypt" || !saltValue || !expectedValue || extra) {
    throw new Error("ADMIN_PASSWORD_HASH has an invalid format.");
  }

  const expected = Buffer.from(expectedValue, "base64url");
  if (expected.length !== 64) throw new Error("ADMIN_PASSWORD_HASH is invalid.");
  const actual = (await scrypt(password, Buffer.from(saltValue, "base64url"), 64)) as Buffer;
  return timingSafeEqual(actual, expected);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Error("INVALID_ORIGIN");
  }
}

export function getClientFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", sessionSecret()).update(ip).digest("hex").slice(0, 32);
}

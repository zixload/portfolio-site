import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clearAdminSession,
  getClientFingerprint,
  hasAdminSession,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";

function response(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export async function GET() {
  return response({ authenticated: await hasAdminSession() });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const fingerprint = getClientFingerprint(request);
    const key = `login:${fingerprint}`;
    const limit = await checkRateLimit(key, 5, 15 * 60);
    if (!limit.allowed) {
      return response(
        { error: "Trop de tentatives. Réessaie plus tard." },
        429,
        { "Retry-After": String(limit.retryAfter) },
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 2_048) return response({ error: "Requête invalide." }, 413);
    const payload = (await request.json()) as { password?: unknown };
    const password = typeof payload.password === "string" ? payload.password : "";
    const valid = password.length <= 256 && (await verifyAdminPassword(password));
    const remainingDelay = 350 - (Date.now() - startedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
    if (!valid) return response({ error: "Identifiants invalides." }, 401);

    await setAdminSession();
    await clearRateLimit(key);
    return response({ authenticated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INVALID_ORIGIN") return response({ error: "Origine refusée." }, 403);
    if (
      message.includes("NOT_CONFIGURED") ||
      message.includes("not configured") ||
      message.startsWith("ADMIN_")
    ) {
      return response({ error: "L'administration n'est pas encore configurée." }, 503);
    }
    return response({ error: "Connexion momentanément indisponible." }, 503);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await clearAdminSession();
    return response({ authenticated: false });
  } catch {
    return response({ error: "Requête refusée." }, 403);
  }
}

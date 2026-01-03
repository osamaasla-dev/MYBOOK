import { consumeRateLimit } from "@/features/parts/ratelimit/utils/consumeRateLimit";
import { extractClientIp } from "@/features/parts/ratelimit/utils/request";
import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";
import { createId } from "@paralleldrive/cuid2";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PAGES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

const PROTECTED_ROUTE_PATTERNS = [/^\/user(?:\/.*)?$/];
const ADMIN_ROUTE_PATTERNS = [/^\/admin(?:\/.*)?$/, /^\/api\/admin(?:\/.*)?$/];
const MAINTENANCE_ALLOWLIST = [
  /^\/status$/,
  /^\/api\/health$/,
  /^\/maintenance$/,
  /^\/robots\.txt$/,
  /^\/site\.webmanifest$/,
] as const;
const API_RATE_LIMIT_SKIP = [
  /^\/api\/auth(?:\/.*)?$/,
  /^\/api\/pusher(?:\/.*)?$/,
];

const API_RATE_LIMIT_NAMESPACE = "edge:api";
const API_RATE_LIMIT_WINDOW_SECONDS = 60;
const API_RATE_LIMIT_MAX = 240;

const MAINTENANCE_ALLOWED_ROLES = new Set(["ADMIN"]);

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "Cross-Origin-Resource-Policy": "same-site",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://res.cloudinary.com https://*.pusher.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

const isMaintenanceMode =
  process.env.MAINTENANCE_MODE?.toLowerCase() === "true" ||
  process.env.MAINTENANCE_MODE === "1";

function matchesPattern(pathname: string, patterns: readonly RegExp[]) {
  return patterns.some((regex) => regex.test(pathname));
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isMaintenanceExempt(pathname: string) {
  return matchesPattern(pathname, MAINTENANCE_ALLOWLIST);
}

function shouldSkipRateLimit(pathname: string) {
  return matchesPattern(pathname, API_RATE_LIMIT_SKIP);
}

async function enforceApiRateLimit({
  req,
  tokenSub,
  requestId,
}: {
  req: NextRequest;
  tokenSub?: string | null;
  requestId: string;
}) {
  try {
    const clientIp = extractClientIp(req);
    const limited = await consumeRateLimit({
      namespace: API_RATE_LIMIT_NAMESPACE,
      identifiers: [
        { key: "ip", value: clientIp },
        { key: "user", value: tokenSub },
      ],
      windowSeconds: API_RATE_LIMIT_WINDOW_SECONDS,
      maxRequests: API_RATE_LIMIT_MAX,
    });

    if (limited) {
      const res = apiResponse(
        false,
        {},
        userMessages.rateLimited,
        429,
        requestId
      );
      res.headers.set("retry-after", `${API_RATE_LIMIT_WINDOW_SECONDS}`);
      return res;
    }
  } catch (error) {
    console.error("edge_api_rate_limit_error", error);
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl;

  const start = performance.now();
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId =
    incomingRequestId || globalThis.crypto?.randomUUID?.() || createId();

  const fwdHeaders = new Headers(req.headers);
  fwdHeaders.set("x-request-id", requestId);

  const respond = (res: NextResponse) => {
    const durationMs = Math.round(performance.now() - start);
    res.headers.set("x-request-id", requestId);
    res.headers.set("x-response-time", `${durationMs}ms`);

    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      if (!res.headers.has(key)) {
        res.headers.set(key, value);
      }
    });

    console.info(
      JSON.stringify({
        msg: "request_complete",
        id: requestId,
        method: req.method,
        path: pathname,
        status: res.status,
        duration_ms: durationMs,
        ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          undefined,
        ua: req.headers.get("user-agent") || undefined,
      })
    );

    return res;
  };

  console.info(
    JSON.stringify({
      msg: "incoming_request",
      id: requestId,
      method: req.method,
      path: pathname,
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      ua: req.headers.get("user-agent") || undefined,
    })
  );

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthed = !!token;
  const userRole = token?.role;

  const redirectToSignIn = () => {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", url.toString());
    return respond(NextResponse.redirect(signInUrl));
  };

  const isApiRoute = pathname.startsWith("/api");

  if (
    isMaintenanceMode &&
    !isMaintenanceExempt(pathname) &&
    !(
      userRole &&
      MAINTENANCE_ALLOWED_ROLES.has(userRole.toString().toUpperCase())
    )
  ) {
    const maintenanceMessage =
      process.env.MAINTENANCE_MESSAGE ??
      "The platform is temporarily unavailable while we perform scheduled maintenance.";

    const maintenanceResponse = isApiRoute
      ? apiResponse(false, {}, maintenanceMessage, 503, requestId)
      : new NextResponse(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Maintenance</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background-color:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem;text-align:center}section{max-width:480px}h1{font-size:2rem;margin-bottom:0.75rem}p{line-height:1.5;color:#cbd5f5}</style></head><body><section><h1>We&rsquo;ll be right back</h1><p>${maintenanceMessage}</p></section></body></html>`,
          {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
    maintenanceResponse.headers.set("Retry-After", "60");
    return respond(maintenanceResponse);
  }

  if (isAuthPage(pathname) && isAuthed) {
    const destination = token?.role === "ADMIN" ? "/admin" : "/user";
    const res = NextResponse.redirect(new URL(destination, req.url));
    return respond(res);
  }

  if (matchesPattern(pathname, PROTECTED_ROUTE_PATTERNS) && !isAuthed) {
    return redirectToSignIn();
  }

  if (matchesPattern(pathname, ADMIN_ROUTE_PATTERNS)) {
    if (!isAuthed) {
      if (isApiRoute) {
        return respond(
          apiResponse(false, {}, userMessages.unauthorized, 401, requestId)
        );
      }
      return redirectToSignIn();
    }

    if (userRole?.toUpperCase() !== "ADMIN") {
      const forbidden = isApiRoute
        ? apiResponse(false, {}, userMessages.unauthorized, 403, requestId)
        : NextResponse.redirect(new URL("/user", req.url));
      return respond(forbidden);
    }
  }

  if (
    isApiRoute &&
    req.method !== "OPTIONS" &&
    !shouldSkipRateLimit(pathname)
  ) {
    const rateLimitedResponse = await enforceApiRateLimit({
      req,
      tokenSub: token?.sub,
      requestId,
    });
    if (rateLimitedResponse) {
      return respond(rateLimitedResponse);
    }
  }

  return respond(NextResponse.next({ request: { headers: fwdHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|robots\\.txt).*)",
  ],
};

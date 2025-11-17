import { createId } from "@paralleldrive/cuid2";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl;

  // Start timer
  const start = performance.now();

  // Request ID: respect incoming header if present, else generate
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId =
    incomingRequestId || globalThis.crypto?.randomUUID?.() || createId();

  // Forward request-id to downstream handlers
  const fwdHeaders = new Headers(req.headers);
  fwdHeaders.set("x-request-id", requestId);

  // Helper to attach common headers and emit final log
  const respond = (res: NextResponse) => {
    const durationMs = Math.round(performance.now() - start);
    res.headers.set("x-request-id", requestId);
    res.headers.set("x-response-time", `${durationMs}ms`);

    // Structured final log line
    // Use console (Edge runtime) instead of server logger
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

  // Initial structured log (ingress)
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

  // Get JWT (includes role via callbacks in `src/lib/authOptions.ts`)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthed = !!token;

  // Helper: redirect to sign-in with callbackUrl
  const redirectToSignIn = () => {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", url.toString());
    return respond(NextResponse.redirect(signInUrl));
  };

  // Admin routes are not handled at this time (user-only middleware)

  // User protected pages
  if (pathname === "/user" || pathname.startsWith("/user/")) {
    if (!isAuthed) return redirectToSignIn();
    return respond(NextResponse.next({ request: { headers: fwdHeaders } }));
  }

  // No API routes handled here yet

  // Default pass-through
  return respond(NextResponse.next({ request: { headers: fwdHeaders } }));
}

export const config = {
  matcher: [
    // User root page only (expand as new pages are added)
    "/user",
    "/user/:path*",
  ],
};

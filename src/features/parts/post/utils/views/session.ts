import { createHash } from "crypto";

import { extractClientIp } from "@/features/parts/follow/utils";

export type PostViewIdentity = {
  viewerId: string | null;
  viewerKey: string | null;
  sessionHash: string | null;
  ip: string | null;
  countryCode: string | null;
  userAgent: string | null;
};

export function resolvePostViewIdentity({
  request,
  viewerId,
}: {
  request: Request;
  viewerId: string | null;
}): PostViewIdentity {
  const ip = extractClientIp(request);
  const countryCode =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  if (viewerId) {
    return {
      viewerId,
      viewerKey: `user:${viewerId}`,
      sessionHash: null,
      ip,
      countryCode,
      userAgent,
    };
  }

  const rawFingerprint = `${ip ?? "unknown"}:${userAgent ?? "unknown"}`;
  const sessionHash = createHash("sha1").update(rawFingerprint).digest("hex");

  return {
    viewerId: null,
    viewerKey: `anon:${sessionHash}`,
    sessionHash,
    ip,
    countryCode,
    userAgent,
  };
}

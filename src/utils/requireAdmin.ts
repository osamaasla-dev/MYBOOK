import { NextResponse } from "next/server";
import { ServerSession } from "@/utils/session";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { apiResponse } from "@/lib/apiResponse";

export type AdminGuardResult = { userId: string };

// Returns AdminGuardResult on success, or a NextResponse (401/403) you should return from the route handler
export async function requireAdmin(
  requestId?: string
): Promise<AdminGuardResult | NextResponse> {
  const session = await ServerSession();
  if (!session?.user?.id) {
    return apiResponse(
      false,
      null,
      "UNAUTHORIZED",
      401,
      requestId || "unknown"
    );
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me || me.role !== UserRole.ADMIN) {
    return apiResponse(false, null, "FORBIDDEN", 403, requestId || "unknown");
  }
  return { userId: session.user.id };
}

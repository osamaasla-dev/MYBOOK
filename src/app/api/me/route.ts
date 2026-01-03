import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { userMessages } from "@/lib/messages";
import { CurrentUser } from "@/features/types";

const ROUTE = "/api/me";

export async function GET() {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info(`Navbar user request started`);
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    const user: CurrentUser | null = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      log.warn(`${userMessages.notFound}`);
      const res = apiResponse(false, {}, userMessages.notFound, 404, requestId);
      return res;
    }

    log.info({ userId: viewer.id }, `${userMessages.success}`);
    const res = apiResponse(true, user, userMessages.success, 200, requestId);
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, `${userMessages.failed}`);
    const res = apiResponse(
      false,
      {},
      error.message ?? userMessages.failed,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}

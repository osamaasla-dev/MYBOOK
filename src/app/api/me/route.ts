import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { userMessages } from "@/lib/messages";
import { CurrentUser } from "@/features/types";

const ROUTE = "/api/users/navbar/user";

export async function GET() {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info(`Navbar user request started`);
    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(`${userMessages.unauthorized}`);
      const res = apiResponse(
        false,
        {},
        userMessages.unauthorized,
        401,
        requestId
      );
      return res;
    }

    const user: CurrentUser | null = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    log.info({ userId: session.user.id }, `${userMessages.success}`);
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

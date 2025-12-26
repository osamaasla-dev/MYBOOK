import { apiResponse } from "@/lib/apiResponse";
import { commentMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { Logger } from "pino";

export async function validateSession(log: Logger, requestId: string) {
  const session = await ServerSession();

  if (!session?.user?.id) {
    log.warn("Authentication check failed - no session or user ID");
    return {
      error: apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      ),
    };
  }

  return { userId: session.user.id };
}

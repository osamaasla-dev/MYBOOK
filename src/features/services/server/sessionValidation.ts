import { userMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";
import type { Logger } from "pino";
import { ServerSession } from "@/utils/session";
import type { User } from "next-auth";

type SessionValidationResult =
  | { ok: false; response: Response }
  | { ok: true; user: User };

export async function validateSession(
  log: Logger,
  requestId: string
): Promise<SessionValidationResult> {
  const session = await ServerSession();

  if (!session?.user?.id) {
    log.warn(userMessages.unauthorized);
    return {
      ok: false,
      response: apiResponse(
        false,
        {},
        userMessages.unauthorized,
        401,
        requestId
      ),
    };
  }

  return {
    ok: true,
    user: session.user,
  };
}

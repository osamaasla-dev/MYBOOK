import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";

import { parseSearchUsersParams } from "@/features/pages/search/utils/searchUsersParams";
import { fetchSearchableUsers } from "@/features/pages/search/services/server/searchUsersService";
import { validateSession } from "@/features/services/server";

const ROUTE = "/api/search/users/list";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    const searchParams = new URL(request.url).searchParams;
    const parsed = parseSearchUsersParams(searchParams);

    if (!parsed.success) {
      log.warn({ issues: parsed.issues }, "Invalid search list query params");
      return apiResponse(
        false,
        { items: [], nextCursor: null },
        parsed.message ?? userMessages.invalidParams,
        400,
        requestId
      );
    }

    const { query, cursor, limit } = parsed.data;
    const { items, nextCursor } = await fetchSearchableUsers({
      viewerId: viewer.id,
      query,
      cursor,
      limit,
    });

    log.info(
      { viewerId: viewer.id, query, count: items.length, nextCursor },
      "User search list completed"
    );

    return apiResponse(
      true,
      { items, nextCursor },
      userMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    const { searchParams } = new URL(request.url);
    log.error(
      { err: error, query: searchParams.get("query"), status: error.status },
      "User search list failed"
    );

    return apiResponse(
      false,
      { items: [], nextCursor: null },
      error.message ?? userMessages.failed,
      error.status ?? 500,
      requestId
    );
  }
}

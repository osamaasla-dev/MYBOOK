import { USER_SEARCH_SUGGESTION_LIMIT } from "@/features/pages/search/constants";
import { fetchSearchableUsers } from "@/features/pages/search/services/server/searchUsersService";
import { validateSession } from "@/features/services/server";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";

const ROUTE = "/api/search/users";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("query") ?? "";
    const query = rawQuery.trim();

    if (!query) {
      log.info("Empty search query received, returning empty result set");
      return apiResponse(
        true,
        { hits: [] },
        userMessages.success,
        200,
        requestId
      );
    }

    const { items } = await fetchSearchableUsers({
      viewerId: viewer.id,
      query,
      limit: USER_SEARCH_SUGGESTION_LIMIT,
    });

    log.info(
      { query, resultCount: items.length, viewerId: viewer.id },
      "User search suggestions completed"
    );

    return apiResponse(
      true,
      { hits: items },
      userMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err: error, status: error.status }, "User search failed");

    return apiResponse(
      false,
      { hits: [] },
      error.message ?? userMessages.failed,
      error.status ?? 500,
      requestId
    );
  }
}

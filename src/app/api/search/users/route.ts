import { USER_SEARCH_SUGGESTION_LIMIT } from "@/features/parts/search/constants";
import { fetchSearchableUsers } from "@/features/parts/search/services/server/searchUsersService";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";

const ROUTE = "/api/search/users";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await ServerSession();
    const viewerId = session?.user?.id ?? null;

    if (!viewerId) {
      log.warn("Unauthorized user search suggestions request");
      return apiResponse(
        false,
        { hits: [] },
        userMessages.unauthorized,
        401,
        requestId
      );
    }

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
      viewerId,
      query,
      limit: USER_SEARCH_SUGGESTION_LIMIT,
    });

    log.info(
      { query, resultCount: items.length, viewerId },
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

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { relationsMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";

import { fetchRelationsList } from "@/features/pages/relations/services/fetchRelations";
import { parseRelationsQuery } from "@/features/pages/relations/schema";

const ROUTE = "/api/me/relations";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Relations fetch started");
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    const url = new URL(request.url);
    const parsedQuery = parseRelationsQuery(url.searchParams);

    if (!parsedQuery.ok) {
      log.warn(
        { reason: parsedQuery.message },
        "Invalid relations query params"
      );
      return apiResponse(
        false,
        {},
        relationsMessages.invalidParams,
        400,
        requestId
      );
    }

    const { tab, limit, cursor } = parsedQuery.value;

    const relations = await fetchRelationsList({
      userId: viewer.id,
      tab,
      limit,
      cursor,
    });

    log.info(
      { userId: viewer.id, tab, count: relations.items.length },
      relationsMessages.fetchSuccess
    );

    return apiResponse(
      true,
      relations,
      relationsMessages.fetchSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, relationsMessages.fetchFailed);
    return apiResponse(
      false,
      {},
      error.message ?? relationsMessages.fetchFailed,
      error.status ?? 500,
      requestId
    );
  }
}

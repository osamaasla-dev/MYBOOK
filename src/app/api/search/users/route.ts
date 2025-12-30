import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { algoliaClient } from "@/lib/algolia.search/algolia.server";
import { ALGOLIA_INDEX_USERS } from "@/lib/algolia.search/constants";
import { saveObjectsInChunks } from "@/lib/algolia.search/saveObjectsInChunks";
import { fetchUsersForIndex } from "@/features/search/users/server/fetchUsersForIndex";
import { mapUsersToAlgoliaObjects } from "@/features/search/users/server/mapUsersToAlgoliaObjects";

const ROUTE = "/api/search/users";
const CHUNK_SIZE = 1000;

export async function POST() {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("User search indexing started");

    const users = await fetchUsersForIndex();
    const objects = mapUsersToAlgoliaObjects(users);

    if (objects.length === 0) {
      log.warn("No users eligible for search indexing");
      return apiResponse(true, null, "No users to index", 200, requestId);
    }

    await saveObjectsInChunks(
      algoliaClient,
      ALGOLIA_INDEX_USERS,
      objects,
      CHUNK_SIZE
    );

    log.info({ count: objects.length }, "User search indexing finished");
    return apiResponse(
      true,
      { indexed: objects.length },
      "User search index updated",
      200,
      requestId
    );
  } catch (error) {
    const err = normalizeError(error);
    log.error({ error: err }, "User search indexing failed");

    return apiResponse(
      false,
      null,
      err.message ?? "Failed to index users",
      err.status ?? 500,
      requestId
    );
  }
}

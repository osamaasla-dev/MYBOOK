import type { Visibility } from "@prisma/client";

import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";
import { loadAuthorPrivacyDefaults } from "../privacy";
import { buildViewerRelationshipMap } from "../relationships";

export type FetchDependencies = {
  privacyDefaults: Map<string, Visibility>;
  relations: Map<string, ViewerRelationshipSnapshot>;
};

export async function loadFetchDependencies(
  viewerId: string,
  authorIds: string[]
): Promise<FetchDependencies> {
  const [privacyDefaults, relations] = await Promise.all([
    loadAuthorPrivacyDefaults(authorIds),
    buildViewerRelationshipMap(viewerId, authorIds),
  ]);

  return { privacyDefaults, relations };
}

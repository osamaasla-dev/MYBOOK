import { notifyManager, type QueryClient } from "@tanstack/react-query";

import { HOME_FEED_QUERY_KEY } from "@/features/pages/home/hooks/useHomeFeed";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { PROFILE_POSTS_QUERY_KEY } from "@/features/pages/profile/hooks/useProfilePosts";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { RELATION_TABS } from "@/features/pages/relations/types";
import { NOTIFICATION_TAB_VALUES } from "@/features/parts/notifications/constants";
import { notificationsQueryKey } from "@/features/parts/notifications/hooks/useNotifications";

export async function invalidateBlockRelatedQueries(
  queryClient: QueryClient,
  username?: string | null
) {
  const invalidations: Array<Promise<unknown>> = [];

  if (username) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: profileQueryKey(username),
      })
    );

    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: PROFILE_POSTS_QUERY_KEY(username),
      })
    );
  }

  invalidations.push(
    ...RELATION_TABS.map((tab) =>
      queryClient.invalidateQueries({
        queryKey: relationsQueryKey(tab),
      })
    )
  );

  invalidations.push(
    queryClient.invalidateQueries({ queryKey: HOME_FEED_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ["postDetails"] }),
    queryClient.invalidateQueries({ queryKey: ["postComments"] })
  );

  invalidations.push(
    ...NOTIFICATION_TAB_VALUES.map((tab) =>
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey(tab),
      })
    )
  );

  await notifyManager.batch(() => Promise.all(invalidations));
}

import { notifyManager } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import type { RelationTab } from "../../types";
import { relationsQueryKey } from "../useRelationsInfiniteList";

export function invalidateRelationTabs(
  queryClient: QueryClient,
  tabs: readonly RelationTab[]
) {
  const uniqueTabs = new Set(tabs);

  notifyManager.batch(() => {
    uniqueTabs.forEach((tab) => {
      queryClient.invalidateQueries({
        queryKey: relationsQueryKey(tab),
      });
    });
  });
}

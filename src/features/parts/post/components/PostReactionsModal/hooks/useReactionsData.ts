import { useMemo } from "react";
import type { ReactionOptionCount } from "../types";
import { POST_REACTION_OPTIONS } from "../../../constants";
import { ReactionTab } from "../../../services/server/reactions";
import { ReactionSummary } from "../../../utils/reaction";
import { usePostReactions } from "../../../hooks";

type UseReactionsDataProps = {
  postId: string;
  currentTab: ReactionTab;
  open: boolean;
  initialSummary?: ReactionSummary | null;
};

export function useReactionsData({
  postId,
  currentTab,
  open,
  initialSummary,
}: UseReactionsDataProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePostReactions({
    postId,
    tab: currentTab,
    limit: 10,
    enabled: open,
  });

  // Process reaction tabs data
  const reactionTabs = useMemo(() => {
    const mergedSummary = data?.reactionSummary ?? initialSummary;

    if (!mergedSummary) {
      return [] as ReactionOptionCount[];
    }

    return POST_REACTION_OPTIONS.map((option) => {
      const count =
        mergedSummary[option.id] ??
        mergedSummary[
          POST_REACTION_OPTIONS.find((opt) => opt.id === option.id)?.emoji ?? ""
        ] ??
        0;

      if (!count) return null;

      return {
        id: option.id,
        label: option.label,
        emoji: option.emoji,
        count,
      } as ReactionOptionCount;
    }).filter(Boolean) as ReactionOptionCount[];
  }, [data?.reactionSummary, initialSummary]);

  // Calculate total reactions count
  const totalReactions = useMemo(() => {
    const mergedSummary = data?.reactionSummary ?? initialSummary;
    if (!mergedSummary) return 0;
    return Object.values(mergedSummary).reduce((sum, value) => sum + value, 0);
  }, [data?.reactionSummary, initialSummary]);

  // Get items list
  const items = data?.items ?? [];

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    reactionTabs,
    totalReactions,
    items,
  };
}

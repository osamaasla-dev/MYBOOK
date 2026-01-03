"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { POST_REACTION_OPTIONS } from "@/features/parts/post/constants/reactions";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import { useCommentReactions } from "@/features/parts/postDetails/hooks/useCommentReactions";
import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";

import type { ReactionOptionCount } from "./types";

type UseCommentReactionsModalContentArgs = {
  postId: string;
  commentId: string;
  open: boolean;
  initialTab: CommentReactionTab;
  initialSummary: ReactionSummary | null;
};

export function useCommentReactionsModalContent({
  postId,
  commentId,
  open,
  initialTab,
  initialSummary,
}: UseCommentReactionsModalContentArgs) {
  const [currentTab, setCurrentTab] = useState<CommentReactionTab>(initialTab);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReactions({
    postId,
    commentId,
    tab: currentTab,
    limit: 10,
    enabled: open,
  });

  useInfiniteScroll({
    sentinelRef,
    rootRef: listRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 320px 0px",
    enabled: open,
  });

  const mergedSummary = data?.reactionSummary ?? initialSummary;

  const reactionTabs = useMemo(() => {
    if (!mergedSummary) return [] as ReactionOptionCount[];

    return POST_REACTION_OPTIONS.map((option) => {
      const count = mergedSummary[option.id] ?? 0;
      if (!count) return null;
      return {
        id: option.id,
        label: option.label,
        emoji: option.emoji,
        count,
      } satisfies ReactionOptionCount;
    }).filter(Boolean) as ReactionOptionCount[];
  }, [mergedSummary]);

  const totalReactions = useMemo(() => {
    if (!mergedSummary) return 0;
    return Object.values(mergedSummary).reduce((sum, value) => sum + value, 0);
  }, [mergedSummary]);

  useEffect(() => {
    if (currentTab === "all") return;
    if (!reactionTabs.some((tab) => tab.id === currentTab)) {
      setCurrentTab(reactionTabs[0]?.id ?? "all");
    }
  }, [currentTab, reactionTabs]);

  const items = data?.items ?? [];
  const resolvedAllCount =
    totalReactions || (currentTab === "all" ? items.length : 0);

  return {
    currentTab,
    setCurrentTab,
    reactionTabs,
    resolvedAllCount,
    listRef,
    sentinelRef,
    items,
    isLoading,
    isError,
    errorMessage: error?.message,
    onRetry: refetch,
    isFetchingNextPage,
  };
}

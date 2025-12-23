"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { POST_REACTION_OPTIONS } from "@/features/parts/post/constants/reactions";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/types";
import { useCommentReactions } from "@/features/parts/postDetails/hooks/useCommentReactions";

import { CommentReactionTabs } from "./ReactionTabs";
import { CommentReactionsList } from "./ReactionsList";
import type { ReactionOptionCount } from "./types";

const MODAL_TITLE = "Comment reactions";

export type CommentReactionsModalProps = {
  postId: string;
  commentId: string;
  open: boolean;
  onClose: () => void;
  initialTab?: CommentReactionTab;
  initialSummary?: ReactionSummary | null;
};

export function CommentReactionsModal({
  postId,
  commentId,
  open,
  onClose,
  initialTab = "all",
  initialSummary = null,
}: CommentReactionsModalProps) {
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/60 bg-white shadow-2xl outline-none focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90">
          <header className="flex items-center justify-between border-b border-border/60 px-3 py-1">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {MODAL_TITLE}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="cursor-pointer flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Close reactions"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </header>

          <section className="flex flex-col gap-4 px-5 py-4">
            <CommentReactionTabs
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              reactionTabs={reactionTabs}
              resolvedAllCount={resolvedAllCount}
            />

            <div
              ref={listRef}
              className="max-h-[65vh] overflow-y-auto pr-2"
              data-testid="comment-reactions-list"
            >
              <CommentReactionsList
                items={items}
                isLoading={isLoading}
                isError={isError}
                errorMessage={error?.message}
                onRetry={refetch}
                sentinelRef={sentinelRef}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

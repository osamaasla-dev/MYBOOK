"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { POST_REACTION_OPTIONS } from "../constants/reactions";
import { usePostReactions } from "../hooks/usePostReactions";
import type { ReactionSummary } from "../utils/reaction";
import type { ReactionTab } from "../services/server/reactions";

import { ReactionTabs } from "./PostReactionsModal/ReactionTabs";
import { ReactionsList } from "./PostReactionsModal/ReactionsList";
import type { ReactionOptionCount } from "./PostReactionsModal/types";

const MODAL_TITLE = "Post reactions";

export type PostReactionsModalProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
  initialTab?: ReactionTab;
  initialSummary?: ReactionSummary | null;
  title?: string;
};

export function PostReactionsModal({
  postId,
  open,
  onClose,
  initialTab = "all",
  initialSummary = null,
  title = MODAL_TITLE,
}: PostReactionsModalProps) {
  const [currentTab, setCurrentTab] = useState<ReactionTab>(initialTab);
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
  } = usePostReactions({
    postId,
    tab: currentTab,
    limit: 10,
    enabled: open,
  });

  useInfiniteScroll({
    containerRef: listRef,
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 320px 0px",
    enabled: open,
  });

  const mergedSummary = data?.reactionSummary ?? initialSummary;

  const reactionTabs = useMemo(() => {
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
              {title}
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
            <ReactionTabs
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              reactionTabs={reactionTabs}
              resolvedAllCount={resolvedAllCount}
            />

            <div
              ref={listRef}
              className="max-h-[65vh] overflow-y-auto pr-2"
              data-testid="post-reactions-list"
            >
              <ReactionsList
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

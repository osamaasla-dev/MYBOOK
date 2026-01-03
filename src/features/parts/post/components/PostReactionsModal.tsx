"use client";

import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { ReactionSummary } from "../utils/reaction";
import type { ReactionTab } from "../services/server/reactions";

import {
  useTabState,
  useReactionsData,
  ModalContent,
  ModalHeader,
} from "./PostReactionsModal/index";

const MODAL_TITLE = "Post reactions";

export type PostReactionsModalProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
  initialTab?: ReactionTab;
  initialSummary?: ReactionSummary | null;
  title?: string;
  testId?: string;
};

export function PostReactionsModal({
  postId,
  open,
  onClose,
  initialTab = "all",
  initialSummary = null,
  title = MODAL_TITLE,
  testId,
}: PostReactionsModalProps) {
  // Refs for infinite scroll
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Tab state management
  const { currentTab, setCurrentTab } = useTabState({
    initialTab,
    reactionTabs: [], // Will be updated when data loads
    open,
  });

  // Reactions data fetching and processing
  const {
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
  } = useReactionsData({
    postId,
    currentTab,
    open,
    initialSummary,
  });

  // Infinite scroll setup
  useInfiniteScroll({
    rootRef: listRef,
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 320px 0px",
    enabled: open,
  });

  // Calculate resolved count for "All" tab
  const resolvedAllCount =
    totalReactions || (currentTab === "all" ? items.length : 0);

  // Event handlers
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value as ReactionTab);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          data-testid={testId ? `${testId}-overlay` : "post-reactions-overlay"}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/60 bg-white shadow-2xl outline-none focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90"
          aria-describedby={
            testId ? `${testId}-description` : "post-reactions-description"
          }
          data-testid={testId || "post-reactions-modal"}
        >
          <ModalHeader title={title} testId={testId} />

          <ModalContent
            postId={postId}
            currentTab={currentTab}
            onTabChange={handleTabChange}
            reactionTabs={reactionTabs}
            resolvedAllCount={resolvedAllCount}
            items={items}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message}
            onRetry={refetch}
            sentinelRef={sentinelRef}
            listRef={listRef}
            isFetchingNextPage={isFetchingNextPage}
            testId={testId}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

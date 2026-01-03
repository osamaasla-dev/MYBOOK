"use client";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";

import { CommentReactionTabs } from "./ReactionTabs";
import { CommentReactionsList } from "./ReactionsList";
import { useCommentReactionsModalContent } from "./useCommentReactionsModalContent";

type CommentReactionsModalContentProps = {
  postId: string;
  commentId: string;
  open: boolean;
  initialTab: CommentReactionTab;
  initialSummary: ReactionSummary | null;
};

export function CommentReactionsModalContent({
  postId,
  commentId,
  open,
  initialTab,
  initialSummary,
}: CommentReactionsModalContentProps) {
  const {
    currentTab,
    setCurrentTab,
    reactionTabs,
    resolvedAllCount,
    listRef,
    sentinelRef,
    items,
    isLoading,
    isError,
    errorMessage,
    onRetry,
    isFetchingNextPage,
  } = useCommentReactionsModalContent({
    postId,
    commentId,
    open,
    initialTab,
    initialSummary,
  });

  return (
    <section
      className="flex flex-col gap-4 px-5 py-4"
      id="comment-reactions-modal-description"
      data-testid="comment-reactions-modal-body"
    >
      <CommentReactionTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        reactionTabs={reactionTabs}
        resolvedAllCount={resolvedAllCount}
        postId={postId}
        commentId={commentId}
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
          errorMessage={errorMessage}
          onRetry={onRetry}
          sentinelRef={sentinelRef}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </section>
  );
}

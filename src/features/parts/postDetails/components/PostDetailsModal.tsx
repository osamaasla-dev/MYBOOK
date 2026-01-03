"use client";

import { useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { usePostComments, usePostDetails } from "../hooks";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useCurrentUser } from "@/features/hooks";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  PostDetailsHeader,
  PostDetailsFooter,
  PostDetailsContent,
} from "./PostDetailsModal/index";

type PostDetailsModalProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

export function PostDetailsModal({
  postId,
  open,
  onClose,
}: PostDetailsModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = usePostDetails({
    postId,
    enabled: open,
  });

  const { data: currentUser } = useCurrentUser(open);

  const hasPost = Boolean(post);
  const viewerId = currentUser?.id ?? null;
  const postAuthorId = post?.author.id ?? null;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: commentsData,
    isLoading: areCommentsLoading,
    isError: areCommentsError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchComments,
  } = usePostComments({
    postId,
    enabled: open && hasPost,
  });

  const comments = commentsData?.items ?? [];

  const commentsEmpty =
    !areCommentsLoading && !areCommentsError && comments.length === 0;

  const loadMoreComments = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useInfiniteScroll({
    sentinelRef,
    rootRef: scrollContainerRef,
    hasNextPage,
    isFetching: isFetchingNextPage,
    onLoadMore: loadMoreComments,
    enabled: open && hasPost,
    rootMargin: "0px 0px 300px 0px",
  });

  if (!post) return;
  const modalTitleId = "post-details-modal-title";
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          data-testid="post-details-overlay"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-2xl outline-none focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          data-testid="post-details-modal"
        >
          <VisuallyHidden>
            <Dialog.Title id={`${modalTitleId}-hidden`}>
              Post details
            </Dialog.Title>
          </VisuallyHidden>
          <PostDetailsHeader onClose={onClose} titleId={modalTitleId} />

          <PostDetailsContent
            post={post}
            postId={postId}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            scrollContainerRef={scrollContainerRef}
            comments={comments}
            areCommentsLoading={areCommentsLoading}
            areCommentsError={areCommentsError}
            commentsEmpty={commentsEmpty}
            onRetry={refetchComments}
            sentinelRef={sentinelRef}
            isFetchingNextPage={isFetchingNextPage}
            hasMoreComments={hasNextPage}
            viewerId={viewerId}
            postAuthorId={postAuthorId}
          />

          <PostDetailsFooter postId={postId} hasPost={hasPost} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { AvatarBubble } from "@/features/parts/post/components/PostCard/AvatarBubble";
import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import { CommentActionsMenu } from "./CommentActionsMenu";
import { CommentEditForm } from "./CommentEditForm";
import { ReplyForm } from "./ReplyForm";
import { useUpdatePostComment } from "../../hooks/useUpdatePostComment";
import { useCreateReply } from "../../hooks/useCreateReply";
import { useCommentReplies } from "../../hooks/useReplies";
import { CommentReactionButton } from "./CommentReactionButton";
import { CommentReactionSummary } from "./CommentReactionSummary";
import { CommentReactionsModal } from "./CommentReactionsModal/CommentReactionsModal";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/hooks";
import { useUpdateReply } from "../../hooks/useUpdateReply";

function getRelativeTimestampLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds < 60) {
    return "just now";
  }

  const divisions = [
    { amount: 60, unit: "s" },
    { amount: 60, unit: "m" },
    { amount: 24, unit: "h" },
    { amount: 7, unit: "d" },
    { amount: 4.34524, unit: "w" },
    { amount: 12, unit: "M" },
    { amount: Number.POSITIVE_INFINITY, unit: "y" },
  ] as const;

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      const value = Math.abs(duration);
      return `${value}${division.unit}`;
    }
    duration = Math.round(duration / division.amount);
  }

  return `${Math.abs(duration)}y`;
}

type CommentListItemProps = {
  comment: PostCommentListItem;
  viewerId: string | null;
  postAuthorId: string | null;
  postId: string;
};

export function CommentListItem({
  comment,
  viewerId,
  postAuthorId,
  postId,
}: CommentListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isViewingReplies, setIsViewingReplies] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const updateCommentMutation = useUpdatePostComment({
    postId,
    parentId: null,
  });

  const updateReplyMutation = useUpdateReply({
    postId,
    parentId: comment.parentId ?? "",
  });

  // Choose the appropriate mutation based on whether this is a reply
  const activeUpdateMutation = comment.parentId
    ? updateReplyMutation
    : updateCommentMutation;

  const createReply = useCreateReply({
    postId,
    parentId: comment.id,
    parentIdOfParent: comment.parentId,
    viewer: currentUser,
  });

  // Fetch replies for this comment
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReplies({
    postId,
    parentId: comment.id ?? "",
    limit: 1, // Load 3 replies per page
    enabled: comment.replyCount > 0, // Only fetch if there are replies
  });

  const displayName =
    comment.author.name ?? comment.author.username ?? "Someone";
  const timestamp = getRelativeTimestampLabel(comment.createdAt);
  const profileHref = comment.author.username
    ? `/user/profile/${comment.author.username}`
    : null;

  const handleEdit = useCallback(() => {
    setEditError(null);
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditError(null);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(
    async (content: string) => {
      try {
        setEditError(null);
        await activeUpdateMutation.mutateAsync({
          commentId: comment.id,
          content,
        });
        setIsEditing(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : activeUpdateMutation.error?.message ??
              "Failed to update comment.";
        setEditError(message);
      }
    },
    [comment.id, activeUpdateMutation]
  );

  const handleReply = useCallback(() => {
    setReplyError(null);
    setIsReplying(true);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyError(null);
    setIsReplying(false);
  }, []);

  const handleSubmitReply = useCallback(
    async (content: string) => {
      try {
        setReplyError(null);
        await createReply.mutateAsync({ content });
        setIsReplying(false);
      } catch {
        const message = createReply.error?.message ?? "Failed to post reply.";
        setReplyError(message);
      }
    },
    [createReply]
  );

  return (
    <li className="relative group/comment flex items-start gap-1">
      {profileHref ? (
        <Link
          href={profileHref}
          className="inline-flex"
          aria-label={`View ${displayName}'s profile`}
        >
          <AvatarBubble
            name={displayName}
            avatarUrl={comment.author.avatarUrl ?? undefined}
            className="h-8 w-8 text-sm"
            imageClassName="h-8 w-8"
          />
        </Link>
      ) : (
        <AvatarBubble
          name={displayName}
          avatarUrl={comment.author.avatarUrl ?? undefined}
          className="h-8 w-8 text-sm"
          imageClassName="h-8 w-8"
        />
      )}
      <div className="flex flex-1 flex-col gap-0.5">
        {isEditing ? (
          <div className="w-full">
            <CommentEditForm
              initialContent={comment.content}
              isSubmitting={activeUpdateMutation.isPending}
              submitError={editError}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          </div>
        ) : (
          <>
            <div className="flex w-full items-start gap-2">
              <div className="flex-1 rounded-xl bg-secondary px-2 py-1">
                <div className="flex items-start gap-2">
                  {profileHref ? (
                    <Link href={profileHref} className="text-sm font-semibold">
                      {displayName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {displayName}
                    </p>
                  )}
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
              <CommentActionsMenu
                commentId={comment.id}
                parentId={comment.parentId}
                postId={postId}
                viewerId={viewerId}
                commentAuthorId={comment.authorId}
                postAuthorId={postAuthorId}
                triggerClassName="group-hover/comment:opacity-100"
                onEdit={handleEdit}
              />
            </div>
            <div className="flex flex-wrap justify-between px-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <time className="text-sm font-semibold">{timestamp}</time>
                {comment.isEdited && (
                  <span className="group/edited relative cursor-default text-xs font-medium text-muted-foreground/80">
                    (Edited)
                    <span className="pointer-events-none absolute -top-8 left-1/2 w-max -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-secondary opacity-0 transition-opacity duration-150 group-hover/edited:opacity-100">
                      Edited {getRelativeTimestampLabel(comment.updatedAt)}
                    </span>
                  </span>
                )}

                {!comment.parentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                    onClick={handleReply}
                    disabled={!viewerId}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Reply</span>
                  </Button>
                )}

                <CommentReactionButton
                  postId={postId}
                  commentId={comment.id}
                  parentId={comment.parentId ?? null}
                  viewerReaction={comment.viewerReaction ?? null}
                  disabled={!viewerId}
                />
              </div>

              <CommentReactionSummary
                summary={comment.reactionSummary}
                reactionsCount={comment.reactionsCount}
                onClick={() => setIsReactionsModalOpen(true)}
              />
            </div>
            {comment.replyCount > 0 && (
              <div className=" pl-4 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-auto h-fit w-fit gap-1 px-1.5 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => setIsViewingReplies(!isViewingReplies)}
                >
                  {isViewingReplies ? "Hide" : "View"} replies (
                  {comment.replyCount})
                </Button>
              </div>
            )}
            {isViewingReplies && (
              <div className=" pl-4 mt-2">
                <ul className="space-y-2">
                  {repliesData?.items.map((reply) => (
                    <CommentListItem
                      key={reply.id}
                      comment={reply}
                      viewerId={viewerId}
                      postAuthorId={postAuthorId}
                      postId={postId}
                    />
                  ))}

                  {hasNextPage && (
                    <li>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-transparent hover:text-foreground ml-auto"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage
                          ? "Loading..."
                          : "Load more replies"}
                      </Button>
                    </li>
                  )}
                </ul>
              </div>
            )}
            {isReplying && (
              <div className="mt-2 pl-8">
                <ReplyForm
                  isSubmitting={createReply.isPending}
                  submitError={replyError}
                  onCancel={handleCancelReply}
                  onSubmit={handleSubmitReply}
                />
              </div>
            )}

            <CommentReactionsModal
              postId={postId}
              commentId={comment.id}
              open={isReactionsModalOpen}
              onClose={() => setIsReactionsModalOpen(false)}
              initialSummary={comment.reactionSummary}
            />
          </>
        )}
      </div>
    </li>
  );
}

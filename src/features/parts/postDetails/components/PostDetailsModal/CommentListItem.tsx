"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { AvatarBubble } from "@/features/parts/post/components/PostCard/AvatarBubble";
import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import { CommentActionsMenu } from "./CommentActionsMenu";
import { CommentEditForm } from "./CommentEditForm";
import { useUpdatePostComment } from "../../hooks/useUpdatePostComment";
import { CommentReactionButton } from "./CommentReactionButton";
import { CommentReactionSummary } from "./CommentReactionSummary";
import { CommentReactionsModal } from "./CommentReactionsModal/CommentReactionsModal";

function getRelativeTimestampLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);

  if (Math.abs(diffSeconds) < 60) {
    return "just now";
  }

  const divisions: Array<{ amount: number; unit: string }> = [
    { amount: 60, unit: "s" },
    { amount: 60, unit: "m" },
    { amount: 24, unit: "h" },
    { amount: 7, unit: "d" },
    { amount: 4.34524, unit: "w" },
    { amount: 12, unit: "M" },
    { amount: Number.POSITIVE_INFINITY, unit: "y" },
  ];

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
  const [editError, setEditError] = useState<string | null>(null);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const updateMutation = useUpdatePostComment({
    postId,
    parentId: comment.parentId ?? null,
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
        await updateMutation.mutateAsync({
          commentId: comment.id,
          content,
        });
        setIsEditing(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : updateMutation.error?.message ?? "Failed to update comment.";
        setEditError(message);
      }
    },
    [comment.id, updateMutation]
  );

  return (
    <li className="group/comment flex items-start gap-1">
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
              isSubmitting={updateMutation.isPending}
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
                    <Link href={profileHref} className="text-sm font-semibold ">
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
            <div className="flex flex-wrap justify-between px-2  text-muted-foreground">
              <div className="flex items-center gap-1">
                <time className="font-semibold text-sm">{timestamp}</time>
                {comment.isEdited && (
                  <span className="group/edited relative cursor-default text-xs font-medium text-muted-foreground/80">
                    (Edited)
                    <span className="pointer-events-none absolute -top-8 left-1/2 w-max -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-secondary opacity-0 transition-opacity duration-150 group-hover/edited:opacity-100">
                      Edited {getRelativeTimestampLabel(comment.updatedAt)}
                    </span>
                  </span>
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

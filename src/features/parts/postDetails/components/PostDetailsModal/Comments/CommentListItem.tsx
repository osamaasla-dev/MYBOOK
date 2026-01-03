"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarBubble } from "@/features/parts/post/components/PostCard/AvatarBubble";

import { CommentActionsMenu } from "./CommentActionsMenu";
import { CommentEditForm } from "./CommentEditForm";
import { CommentReactionButton } from "./CommentReactionButton";
import { CommentReactionSummary } from "./CommentReactionSummary";
import { CommentReactionsModal } from "./CommentReactionsModal";
import { ReplyForm } from "../ReplyForm";
import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";

import { useCommentListItem } from "./CommentListItem/useCommentListItem";

export type CommentListItemProps = {
  comment: PostCommentListItem;
  viewerId: string | null;
  postAuthorId: string | null;
  postId: string;
};

export function CommentListItem(props: CommentListItemProps) {
  const { comment, viewerId, postAuthorId, postId } = props;

  const {
    displayName,
    profileHref,
    timestamp,
    editedTimestamp,
    isEditing,
    editError,
    isEditPending,
    handleEdit,
    handleCancelEdit,
    handleSave,
    isReplying,
    replyError,
    isReplyPending,
    handleReply,
    handleCancelReply,
    handleSubmitReply,
    isViewingReplies,
    toggleReplies,
    replies,
    hasNextPage,
    isFetchingNextPage,
    loadMoreReplies,
    isReactionsModalOpen,
    openReactionsModal,
    closeReactionsModal,
  } = useCommentListItem(props);

  return (
    <li className="group/comment relative flex items-start gap-1">
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
              isSubmitting={isEditPending}
              submitError={editError}
              onCancel={handleCancelEdit}
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
                      Edited {editedTimestamp}
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
                onClick={openReactionsModal}
              />
            </div>

            {comment.replyCount > 0 && (
              <div className="w-full pl-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-auto h-fit w-fit gap-1 px-1.5 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={toggleReplies}
                >
                  {isViewingReplies ? "Hide" : "View"} replies (
                  {comment.replyCount})
                </Button>
              </div>
            )}

            {isViewingReplies && (
              <div className="mt-2 pl-4">
                <ul className="space-y-2">
                  {replies.map((reply: PostCommentListItem) => (
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
                        className="ml-auto text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={loadMoreReplies}
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
                  isSubmitting={isReplyPending}
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
              onClose={closeReactionsModal}
              initialSummary={comment.reactionSummary}
            />
          </>
        )}
      </div>
    </li>
  );
}

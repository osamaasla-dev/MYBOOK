"use client";

import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";

import { useCommentMeta } from "./useCommentMeta";
import { useCommentEditing } from "./useCommentEditing";
import { useCommentReactionsModal } from "./useCommentReactionsModal";
import { useCommentRepliesList } from "./useCommentRepliesList";
import { useCommentReplyComposer } from "./useCommentReplyComposer";

type UseCommentListItemArgs = {
  comment: PostCommentListItem;
  viewerId: string | null;
  postAuthorId: string | null;
  postId: string;
};

export function useCommentListItem({
  comment,
  viewerId,
  postAuthorId,
  postId,
}: UseCommentListItemArgs) {
  const meta = useCommentMeta(comment);
  const editing = useCommentEditing({
    commentId: comment.id,
    parentId: comment.parentId,
    postId,
  });
  const replyComposer = useCommentReplyComposer({
    commentId: comment.id,
    parentId: comment.parentId,
    postId,
  });
  const repliesList = useCommentRepliesList({
    commentId: comment.id,
    postId,
    enabled: comment.replyCount > 0,
  });
  const reactionsModal = useCommentReactionsModal();

  return {
    ...meta,
    ...editing,
    ...replyComposer,
    ...repliesList,
    ...reactionsModal,
    viewerId,
    postAuthorId,
  };
}

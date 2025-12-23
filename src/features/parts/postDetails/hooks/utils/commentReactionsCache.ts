"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import type { PostCommentsQueryData } from "../usePostComments";
import { postCommentsQueryKey } from "../usePostComments";

type CommentUpdater = (comment: PostCommentListItem) => PostCommentListItem;

export function updateCommentInCache(
  queryClient: QueryClient,
  postId: string,
  parentId: string | null,
  commentId: string,
  updater: CommentUpdater
): {
  didUpdate: boolean;
  previousData?: PostCommentsQueryData;
} {
  const cacheKey = postCommentsQueryKey(postId, parentId);
  const previousData =
    queryClient.getQueryData<PostCommentsQueryData>(cacheKey);

  let didUpdate = false;
  let updatedComment: PostCommentListItem | null = null;

  queryClient.setQueryData<PostCommentsQueryData | undefined>(
    cacheKey,
    (data) => {
      if (!data || !Array.isArray(data.pages)) {
        return data;
      }

      const applyUpdater = (comment: PostCommentListItem) => {
        if (comment.id !== commentId) {
          return comment;
        }

        didUpdate = true;
        if (!updatedComment) {
          updatedComment = updater(comment);
        }
        return updatedComment;
      };

      const nextPages = data.pages.map((page) => {
        const comments = Array.isArray(page.comments)
          ? page.comments.map(applyUpdater)
          : page.comments;

        return {
          ...page,
          comments,
        };
      });

      const nextItems = Array.isArray(data.items)
        ? data.items.map(applyUpdater)
        : data.items;

      return {
        ...data,
        pages: nextPages,
        items: nextItems,
      };
    }
  );

  return { didUpdate, previousData };
}

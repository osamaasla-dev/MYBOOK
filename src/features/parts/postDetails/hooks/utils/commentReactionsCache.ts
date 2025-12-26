"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import type {
  PostCommentsQueryData,
  postCommentsQueryKey,
} from "../usePostComments";
import type {
  CommentRepliesQueryData,
  commentRepliesQueryKey,
} from "../useReplies";
import {
  calculateReactionsCount,
  updateReactionSummary,
} from "@/features/parts/post/hooks/utils/reactionSummary";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

export function updateCommentReactionInCache(
  queryClient: QueryClient,
  cacheKey:
    | ReturnType<typeof commentRepliesQueryKey>
    | ReturnType<typeof postCommentsQueryKey>,
  commentId: string,
  reaction: PostReactionType | null
) {
  queryClient.setQueryData<
    PostCommentsQueryData | CommentRepliesQueryData | undefined
  >(cacheKey, (data) => {
    if (!data || !Array.isArray(data.pages)) {
      return data;
    }

    const updateComment = (comment: PostCommentListItem) => {
      if (comment.id !== commentId) {
        return comment;
      }

      if (comment.viewerReaction === reaction) {
        return comment;
      }

      const nextSummary = updateReactionSummary(
        comment.reactionSummary ?? {},
        reaction,
        comment.viewerReaction
      );
      return {
        ...comment,
        reactionSummary: nextSummary,
        reactionsCount: calculateReactionsCount(nextSummary),
        viewerReaction: reaction,
      };
    };

    const nextPages = data?.pages?.map((page) => ({
      ...page,
      comments: page?.comments?.map(updateComment),
    }));

    const nextItems = data?.items?.map(updateComment);

    return {
      ...data,
      pages: nextPages,
      items: nextItems,
    };
  });
}

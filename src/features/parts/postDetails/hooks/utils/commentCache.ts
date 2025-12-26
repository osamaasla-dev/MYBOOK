"use client";

import { QueryClient } from "@tanstack/react-query";
import type { PostComment } from "../../services/client/createCommentApi";
import type {
  FetchPostCommentsResponse,
  PostCommentListItem,
} from "../../services/client/fetchPostCommentsApi";
import type {
  PostCommentsQueryData,
  postCommentsQueryKey,
} from "../usePostComments";
import { postDetailsQueryKey } from "../usePostDetails";
import { commentRepliesQueryKey, CommentRepliesQueryData } from "../useReplies";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

export type OptimisticViewer = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type OptimisticCommentOptions = {
  postId: string;
  parentId: string | null;
  content: string;
  viewer?: OptimisticViewer | null;
};

export function buildOptimisticComment({
  postId,
  parentId,
  content,
  viewer = null,
}: OptimisticCommentOptions): PostCommentListItem {
  const optimisticId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `optimistic-${crypto.randomUUID()}`
      : `optimistic-${Math.random().toString(36).slice(2, 10)}`;
  const timestamp = new Date().toISOString();

  const authorId = viewer?.id ?? "optimistic";
  const authorName = viewer?.name ?? viewer?.username ?? "You";

  return {
    id: optimisticId,
    postId,
    parentId,
    authorId,
    content,
    reactionSummary: null,
    reactionsCount: 0,
    viewerReaction: null,
    replyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    isEdited: false,
    author: {
      id: authorId,
      name: authorName,
      username: viewer?.username ?? null,
      avatarUrl: viewer?.avatarUrl ?? null,
    },
  };
}

export function mapPostCommentToListItem(
  comment: PostComment
): PostCommentListItem {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    content: comment.content,
    reactionSummary: comment.reactionSummary,
    reactionsCount: comment.reactionsCount ?? 0,
    viewerReaction: comment.viewerReaction ?? null,
    replyCount: 0,
    createdAt: comment.createdAt ?? "",
    updatedAt: comment.updatedAt ?? "",
    isEdited: comment.updatedAt !== comment.createdAt,
    author: {
      ...comment.author,
    },
  };
}

export function insertCommentAtTop(
  data: PostCommentsQueryData | undefined,
  comment: PostCommentListItem,
  replaceId?: string
): PostCommentsQueryData {
  const baseData =
    data ??
    ({
      pages: [],
      pageParams: [],
      items: [],
    } satisfies PostCommentsQueryData);

  const hasPages = Array.isArray(baseData.pages) && baseData.pages.length > 0;
  const firstPage: FetchPostCommentsResponse = hasPages
    ? baseData.pages[0]
    : { comments: [], nextCursor: null };
  const restPages = hasPages ? baseData.pages.slice(1) : [];

  const firstComments = Array.isArray(firstPage.comments)
    ? firstPage.comments
    : [];

  const filteredFirstComments = replaceId
    ? firstComments.filter((item) => item.id !== replaceId)
    : firstComments;

  const nextFirstPage: FetchPostCommentsResponse = {
    ...firstPage,
    comments: [comment, ...filteredFirstComments],
  };

  const items = Array.isArray(baseData.items) ? baseData.items : [];

  const filteredItems = replaceId
    ? items.filter((item) => item.id !== replaceId)
    : items;

  return {
    pages: [nextFirstPage, ...restPages],
    pageParams:
      baseData.pageParams.length > 0 ? [...baseData.pageParams] : [undefined],
    items: [comment, ...filteredItems],
  };
}

export function changeDirectParentReplyCount(
  queryClient: QueryClient,
  cacheKey:
    | ReturnType<typeof commentRepliesQueryKey>
    | ReturnType<typeof postCommentsQueryKey>,
  parentId: string,
  count?: number
) {
  const currentData = queryClient.getQueryData(cacheKey);
  if (!currentData) return;
  const updateComments = (
    comments: PostCommentListItem[] = []
  ): PostCommentListItem[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        // Found the direct parent, increment replyCount
        return {
          ...comment,
          replyCount: (comment.replyCount ?? 0) + (count ?? 0),
        };
      }
      return comment;
    });
  };

  queryClient.setQueryData(
    cacheKey,
    (data: PostCommentsQueryData | CommentRepliesQueryData) => {
      if (!data) return data;

      const newPages =
        data.pages?.map((page) => ({
          ...page,
          comments: updateComments(page.comments),
        })) ?? [];

      const newItems = updateComments(data.items ?? []);

      return {
        ...data,
        pages: newPages,
        items: newItems,
      };
    }
  );
}

export function removeCommentFromCache(
  data: PostCommentsQueryData | undefined,
  commentId: string
): PostCommentsQueryData | undefined {
  if (!data) {
    return data;
  }

  const nextPages = data.pages.map((page) => {
    const comments = Array.isArray(page.comments) ? page.comments : [];
    return {
      ...page,
      comments: comments.filter((comment) => comment.id !== commentId),
    };
  });

  const nextItems = Array.isArray(data.items)
    ? data.items.filter((item) => item.id !== commentId)
    : [];

  return {
    ...data,
    pages: nextPages,
    items: nextItems,
  };
}

export function changePostDetailsCommentsCount(
  queryClient: QueryClient,
  postDetailsKey: ReturnType<typeof postDetailsQueryKey>,
  count?: number
) {
  queryClient.setQueryData<FeedPost | undefined>(
    postDetailsKey,
    (currentDetails) => {
      if (!currentDetails) return currentDetails;

      return {
        ...currentDetails,
        commentsCount: Math.max(
          (currentDetails.commentsCount ?? 0) + (count ?? 0),
          0
        ),
      };
    }
  );
}

export function updateCommentInCache(
  queryClient: QueryClient,
  cacheKey:
    | ReturnType<typeof commentRepliesQueryKey>
    | ReturnType<typeof postCommentsQueryKey>,
  updatedComment: { id: string; content: string; updatedAt: string | null }
) {
  queryClient.setQueryData<
    PostCommentsQueryData | CommentRepliesQueryData | undefined
  >(cacheKey, (currentData) => {
    if (!currentData) return currentData;
    if (!Array.isArray(currentData.pages) || currentData.pages.length === 0) {
      return currentData;
    }

    const nextUpdatedAt = updatedComment.updatedAt ?? new Date().toISOString();

    const mapComment = <T extends { id: string }>(comment: T) =>
      comment.id === updatedComment.id
        ? {
            ...comment,
            content: updatedComment.content,
            updatedAt: nextUpdatedAt,
            isEdited: true,
          }
        : comment;

    const newPages = currentData.pages.map((page) => {
      if (!Array.isArray(page?.comments)) {
        return page;
      }
      return {
        ...page,
        comments: page.comments.map(mapComment),
      };
    });

    const newItems = Array.isArray(currentData.items)
      ? currentData.items.map(mapComment)
      : currentData.items;

    return {
      ...currentData,
      pages: newPages,
      items: newItems,
    };
  });
}

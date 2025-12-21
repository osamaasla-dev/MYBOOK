"use client";

import type { PostComment } from "../../services/client/createCommentApi";
import type {
  FetchPostCommentsResponse,
  PostCommentListItem,
} from "../../services/client/fetchPostCommentsApi";
import type { PostCommentsQueryData } from "../usePostComments";

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
    replyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
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
    replyCount: 0,
    createdAt: comment.createdAt ?? "",
    updatedAt: comment.updatedAt ?? "",
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
      hasMore: false,
      nextCursor: null,
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
    hasMore: baseData.hasMore,
    nextCursor: baseData.nextCursor,
  };
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

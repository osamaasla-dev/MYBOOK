import { commentMessages } from "@/lib/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DeleteCommentPayload,
  deletePostCommentRequest,
} from "../services/client/deleteCommentApi";
import { postCommentsQueryKey, PostCommentsQueryData } from "./usePostComments";
import {
  changeDirectParentReplyCount,
  changePostDetailsCommentsCount,
  removeCommentFromCache,
} from "./utils";
import { commentRepliesQueryKey } from "./useReplies";
import { postDetailsQueryKey } from "./usePostDetails";
import { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

type UseDeleteCommentReplyOptions = {
  postId: string;

  parentId: string; // إجباري
  parentParentId?: string | null; // أب الأب (اختياري)
};
type DeleteReplyContext = {
  previousReplies?: PostCommentsQueryData;
  previousParentList?: PostCommentsQueryData;
  previousPostDetails?: FeedPost;
};

export function useDeleteCommentReply({
  postId,
  parentId,
}: UseDeleteCommentReplyOptions) {
  const queryClient = useQueryClient();

  const repliesCacheKey = commentRepliesQueryKey(postId, parentId);

  const parentListCacheKey = postCommentsQueryKey(postId, null);
  const postDetailsKey = postDetailsQueryKey(postId);

  return useMutation<void, Error, DeleteCommentPayload, DeleteReplyContext>({
    mutationKey: [
      "postDetails",
      "comments",
      "reply",
      "delete",
      postId,
      parentId,
    ],

    mutationFn: async (payload) => {
      if (!postId) throw new Error(commentMessages.postNotFound);
      if (!payload.commentId) throw new Error(commentMessages.commentNotFound);
      if (!parentId) throw new Error(commentMessages.commentNotFound);
      await deletePostCommentRequest(postId, payload);
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: repliesCacheKey });
      await queryClient.cancelQueries({ queryKey: parentListCacheKey });

      const previousReplies =
        queryClient.getQueryData<PostCommentsQueryData>(repliesCacheKey);

      const previousParentList =
        queryClient.getQueryData<PostCommentsQueryData>(parentListCacheKey);
      const previousPostDetails =
        queryClient.getQueryData<FeedPost>(postDetailsKey);

      // 1️⃣ شيل الريپلاي من لستته
      queryClient.setQueryData<PostCommentsQueryData | undefined>(
        repliesCacheKey,
        (current) => removeCommentFromCache(current, variables.commentId)
      );

      // 2️⃣ نقص replyCount من الأب المباشر فقط
      changeDirectParentReplyCount(
        queryClient,
        parentListCacheKey,
        parentId,
        -1
      );
      changePostDetailsCommentsCount(queryClient, postDetailsKey, -1);

      return {
        previousReplies,
        previousParentList,
        previousPostDetails,
      };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      queryClient.setQueryData(repliesCacheKey, ctx.previousReplies);
      queryClient.setQueryData(parentListCacheKey, ctx.previousParentList);
      queryClient.setQueryData(postDetailsKey, ctx.previousPostDetails);
    },
  });
}

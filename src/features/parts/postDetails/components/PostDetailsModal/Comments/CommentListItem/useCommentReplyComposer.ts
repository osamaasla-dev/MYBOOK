"use client";

import { useCallback, useState } from "react";

import { useCurrentUser } from "@/features/hooks";
import { useCreateReply } from "@/features/parts/postDetails/hooks/useCreateReply";

type UseCommentReplyComposerArgs = {
  commentId: string;
  parentId: string | null;
  postId: string;
};

export function useCommentReplyComposer({
  commentId,
  parentId,
  postId,
}: UseCommentReplyComposerArgs) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  const createReply = useCreateReply({
    postId,
    parentId: commentId,
    parentIdOfParent: parentId,
    viewer: currentUser,
  });

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

  return {
    isReplying,
    replyError,
    isReplyPending: createReply.isPending,
    handleReply,
    handleCancelReply,
    handleSubmitReply,
  };
}

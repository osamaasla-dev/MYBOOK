"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "zod";

import { runTextModeration } from "@/features/parts/moderation/utils";
import { useModerationCheck } from "@/features/parts/moderation/hooks/useModerationCheck";
import moderationMessages from "@/lib/messages/moderation";
import commentMessages from "@/lib/messages/comments";
import { useCurrentUser } from "@/features/hooks";
import { useCreatePostComment } from "../../hooks/useCreatePostComment";
import { createCommentSchema } from "../../schemas";
import type { PostCommentFormProps } from "./types";

type CreateCommentFormValues = z.input<typeof createCommentSchema>;

export function usePostCommentForm({
  postId,
  parentId = null,
}: PostCommentFormProps) {
  const initialParentId = parentId ?? null;
  const { data: currentUser } = useCurrentUser();

  const createCommentMutation = useCreatePostComment({
    postId,
    viewer: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name ?? null,
          username: currentUser.username ?? null,
          avatarUrl: currentUser.avatarUrl ?? null,
        }
      : null,
  });
  const moderationCheck = useModerationCheck();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: "", parentId: initialParentId },
  });

  const contentValue = watch("content") ?? "";
  const charactersCount = contentValue.length;
  const isMutating =
    createCommentMutation.isPending || moderationCheck.isPending;
  const isDisabled = isSubmitting || isMutating;
  const hasContentError = Boolean(errors.content);

  const helperText = useMemo(() => {
    if (errors.content) {
      return String(errors.content.message);
    }
    if (charactersCount > 0) {
      return `${charactersCount}/2000`;
    }
    return "Share your thoughts respectfully.";
  }, [errors.content, charactersCount]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const normalizedValues = createCommentSchema.parse(values);

      const decision = await runTextModeration({
        content: normalizedValues.content,
        context: "comment",
        mutateAsync: moderationCheck.mutateAsync,
      });

      if (decision.status === "reject") {
        toast.error(moderationMessages.blocked);
        return;
      }

      await createCommentMutation.mutateAsync(normalizedValues);
      reset({ content: "", parentId: initialParentId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : commentMessages.unexpectedError;
      toast.error(message);
    }
  });

  const handleClear = () => {
    reset({ content: "", parentId: initialParentId });
  };

  return {
    contentFieldRegister: register("content"),
    contentValue,
    onSubmit,
    helperText,
    hasContentError,
    isDisabled,
    charactersCount,
    handleClear,
    isModerationPending: moderationCheck.isPending,
  };
}

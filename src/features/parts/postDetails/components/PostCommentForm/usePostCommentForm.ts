"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [moderationError, setModerationError] = useState<string | null>(null);

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
  const isMutating = createCommentMutation.isPending;
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
      setModerationError(null);

      await createCommentMutation.mutateAsync(normalizedValues);
      reset({ content: "", parentId: initialParentId });
      setModerationError(null);
    } catch {
      const message =
        createCommentMutation.error?.message ?? commentMessages.unexpectedError;
      setModerationError(message);
    }
  });

  const handleClear = () => {
    reset({ content: "", parentId: initialParentId });
  };

  useEffect(() => {
    if (!moderationError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setModerationError(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [moderationError]);

  return {
    contentFieldRegister: register("content"),
    contentValue,
    onSubmit,
    helperText,
    hasContentError,
    isDisabled,
    charactersCount,
    handleClear,
    moderationError,
  };
}

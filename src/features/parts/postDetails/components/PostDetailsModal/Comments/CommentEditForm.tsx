"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { PostCommentTextarea } from "@/features/parts/postDetails/components/PostCommentForm/PostCommentTextarea";
import { createCommentSchema } from "@/features/parts/postDetails/schemas";

const commentContentSchema = z.object({
  content: createCommentSchema.shape.content,
});

type CommentEditFormValues = z.infer<typeof commentContentSchema>;

type CommentEditFormProps = {
  initialContent: string;
  isSubmitting: boolean;
  submitError: string | null;
  onCancel: () => void;
  onSave: (content: string) => Promise<void>;
};

export function CommentEditForm({
  initialContent,
  isSubmitting,
  submitError,
  onCancel,
  onSave,
}: CommentEditFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CommentEditFormValues>({
    resolver: zodResolver(commentContentSchema),
    defaultValues: { content: initialContent },
  });

  useEffect(() => {
    reset({ content: initialContent });
  }, [initialContent, reset]);

  const contentValue = watch("content") ?? "";
  const hasError = Boolean(errors.content);
  const hasContent = contentValue.trim().length > 0;
  const errorMessageId = submitError ? "comment-edit-error" : undefined;

  const onSubmit = handleSubmit(async (values) => {
    await onSave(values.content.trim());
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-secondary p-3 shadow-inner"
      role="form"
      aria-label="Edit comment form"
      aria-describedby={errorMessageId}
      data-testid="comment-edit-form"
    >
      <PostCommentTextarea
        contentFieldRegister={register("content")}
        contentValue={contentValue}
        disabled={isSubmitting}
        hasError={hasError}
        ariaLabel="Edit comment content"
        ariaRequired
        ariaDescribedBy={errorMessageId}
      />
      {submitError && (
        <p
          id={errorMessageId}
          className="px-1 text-sm font-medium text-danger"
          role="alert"
          aria-live="assertive"
          data-testid="comment-edit-error"
        >
          {submitError}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="danger"
          className=" h-fit px-2 py-1 "
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="comment-edit-cancel"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="px-3 py-1  h-fit"
          type="submit"
          disabled={isSubmitting || !hasContent}
          data-testid="comment-edit-save"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

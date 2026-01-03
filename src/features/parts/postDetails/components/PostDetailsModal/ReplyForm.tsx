"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { PostCommentTextarea } from "@/features/parts/postDetails/components/PostCommentForm/PostCommentTextarea";
import { createReplySchema } from "@/features/parts/postDetails/schemas";

const replyFormSchema = z.object({
  content: createReplySchema.shape.content,
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

type ReplyFormProps = {
  isSubmitting: boolean;
  submitError: string | null;
  onCancel: () => void;
  onSubmit: (content: string) => Promise<void>;
};

export function ReplyForm({
  isSubmitting,
  submitError,
  onCancel,
  onSubmit,
}: ReplyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
  });

  const contentValue = watch("content") ?? "";
  const hasError = Boolean(errors.content);
  const hasContent = contentValue.trim().length > 0;
  const errorMessageId = submitError ? "reply-form-error" : undefined;

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values.content.trim());
    reset();
  });

  return (
    <form
      onSubmit={handleFormSubmit}
      className="mt-2 flex flex-col gap-2 rounded-2xl border border-border/60 bg-secondary p-3 shadow-inner"
      role="form"
      aria-label="Reply form"
      aria-describedby={errorMessageId}
      data-testid="reply-form"
    >
      <PostCommentTextarea
        contentFieldRegister={register("content")}
        contentValue={contentValue}
        disabled={isSubmitting}
        hasError={hasError}
        placeholder="Write a reply..."
        ariaLabel="Write a reply"
        ariaRequired
        ariaDescribedBy={errorMessageId}
      />
      {submitError && (
        <p
          id={errorMessageId}
          className="px-1 text-sm font-medium text-danger"
          role="alert"
          aria-live="assertive"
          data-testid="reply-form-error"
        >
          {submitError}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="danger"
          className="h-fit px-2 py-1"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="reply-form-cancel"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="h-fit px-3 py-1"
          type="submit"
          disabled={isSubmitting || !hasContent}
          data-testid="reply-form-submit"
        >
          {isSubmitting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}

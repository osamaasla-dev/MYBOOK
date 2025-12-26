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

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values.content.trim());
    reset();
  });

  return (
    <form
      onSubmit={handleFormSubmit}
      className="mt-2 flex flex-col gap-2 rounded-2xl border border-border/60 bg-secondary p-3 shadow-inner"
    >
      <PostCommentTextarea
        contentFieldRegister={register("content")}
        contentValue={contentValue}
        disabled={isSubmitting}
        hasError={hasError}
        placeholder="Write a reply..."
      />
      {submitError && (
        <p className="px-1 text-sm font-medium text-danger">{submitError}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="danger"
          className="h-fit px-2 py-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="h-fit px-3 py-1"
          type="submit"
          disabled={isSubmitting || !hasContent}
        >
          {isSubmitting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}

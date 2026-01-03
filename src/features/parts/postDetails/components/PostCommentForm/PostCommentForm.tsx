"use client";

import { PostCommentFormActions } from "./PostCommentFormActions";
import { PostCommentTextarea } from "./PostCommentTextarea";
import type { PostCommentFormProps } from "./types";
import { usePostCommentForm } from "./usePostCommentForm";

export function PostCommentForm(props: PostCommentFormProps) {
  const {
    contentFieldRegister,
    contentValue,
    onSubmit,
    hasContentError,
    isDisabled,
    charactersCount,
    handleClear,
    moderationError,
  } = usePostCommentForm(props);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-2xl border border-border/60 bg-secondary p-3 shadow-inner"
      role="form"
      aria-label="Comment form"
      data-testid="post-comment-form"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <PostCommentTextarea
          contentFieldRegister={contentFieldRegister}
          contentValue={contentValue}
          disabled={isDisabled}
          hasError={hasContentError}
          placeholder="Write something thoughtful…"
          ariaLabel="Comment content"
          ariaRequired={true}
          ariaDescribedBy={hasContentError ? "comment-error" : undefined}
        />

        {moderationError && (
          <p
            id="comment-error"
            className="text-sm font-medium text-danger"
            role="alert"
            aria-live="polite"
            data-testid="comment-error-message"
          >
            {moderationError}
          </p>
        )}

        <PostCommentFormActions
          isDisabled={isDisabled}
          charactersCount={charactersCount}
          onClear={handleClear}
        />
      </div>
    </form>
  );
}

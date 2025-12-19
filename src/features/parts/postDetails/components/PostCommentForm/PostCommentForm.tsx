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
  } = usePostCommentForm(props);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-2xl border border-border/60 bg-secondary p-3 shadow-inner"
    >
      <div className="flex flex-col gap-2">
        <PostCommentTextarea
          contentFieldRegister={contentFieldRegister}
          contentValue={contentValue}
          disabled={isDisabled}
          hasError={hasContentError}
        />

        <PostCommentFormActions
          isDisabled={isDisabled}
          charactersCount={charactersCount}
          onClear={handleClear}
        />
      </div>
    </form>
  );
}

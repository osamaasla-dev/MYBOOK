import { useCallback } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { useLimitedAutosizeTextarea } from "./useLimitedAutosizeTextarea";

type PostCommentTextareaProps = {
  contentFieldRegister: UseFormRegisterReturn;
  disabled: boolean;
  hasError: boolean;
  contentValue: string;
  placeholder?: string;
};

export function PostCommentTextarea({
  contentFieldRegister,
  disabled,
  hasError,
  contentValue,
  placeholder,
}: PostCommentTextareaProps) {
  const autosizeRef = useLimitedAutosizeTextarea({
    value: contentValue,
    maxHeight: 300,
    minHeight: 0,
  });

  const mergedRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      autosizeRef.current = node;
      contentFieldRegister.ref(node);
    },
    [autosizeRef, contentFieldRegister]
  );
  const placeholderText = placeholder ?? "Write something thoughtful…";
  return (
    <Textarea
      dir="auto"
      placeholder={placeholderText}
      className="min-h-6 resize-none border-none bg-transparent px-0 py-0  shadow-none outline-none focus-visible:ring-0 focus-visible:border-none placeholder:text-muted-foreground/80 text-base"
      {...contentFieldRegister}
      ref={mergedRef}
      disabled={disabled}
      aria-invalid={hasError}
    />
  );
}

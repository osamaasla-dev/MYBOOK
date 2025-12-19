import { useCallback } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { useLimitedAutosizeTextarea } from "./useLimitedAutosizeTextarea";

type PostCommentTextareaProps = {
  contentFieldRegister: UseFormRegisterReturn;
  disabled: boolean;
  hasError: boolean;
  contentValue: string;
};

export function PostCommentTextarea({
  contentFieldRegister,
  disabled,
  hasError,
  contentValue,
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

  return (
    <div className="rounded-2xl bg-muted/20">
      <Textarea
        dir="auto"
        placeholder="Write something thoughtful…"
        className="min-h-11 resize-none border-none bg-transparent px-0 py-0 text-base leading-relaxed shadow-none outline-none focus-visible:ring-0 focus-visible:border-none placeholder:text-muted-foreground/80"
        {...contentFieldRegister}
        ref={mergedRef}
        disabled={disabled}
        aria-invalid={hasError}
      />
    </div>
  );
}

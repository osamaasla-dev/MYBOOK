import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type EditorTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    "data-testid"?: string;
  };

export const EditorTextarea = forwardRef<
  HTMLTextAreaElement,
  EditorTextareaProps
>(({ className, "data-testid": testId, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        "pt-1 pb-1 w-full resize-none border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground",
        className
      )}
      data-testid={testId || "editor-textarea"}
      aria-label="Write your post content"
      aria-multiline="true"
      aria-describedby={props["aria-describedby"]}
      {...props}
    />
  );
});

EditorTextarea.displayName = "EditorTextarea";

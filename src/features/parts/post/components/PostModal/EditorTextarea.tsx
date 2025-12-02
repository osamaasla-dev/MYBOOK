import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type EditorTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const EditorTextarea = forwardRef<
  HTMLTextAreaElement,
  EditorTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        "pt-1 pb-1 w-full resize-none border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});

EditorTextarea.displayName = "EditorTextarea";

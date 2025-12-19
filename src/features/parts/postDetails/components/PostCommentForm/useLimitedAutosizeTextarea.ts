import { useEffect, useRef } from "react";

type UseLimitedAutosizeTextareaOptions = {
  value: string;
  maxHeight?: number;
  minHeight?: number;
};

const DEFAULT_MAX_HEIGHT = 200;
const DEFAULT_MIN_HEIGHT = 0;

export function useLimitedAutosizeTextarea({
  value,
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
}: UseLimitedAutosizeTextareaOptions) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight, minHeight]);

  return textareaRef;
}

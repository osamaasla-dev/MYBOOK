import { useEffect, useRef } from "react";

export function useAutosizeTextarea(value: string, dependencyKey?: unknown) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value, dependencyKey]);

  return textareaRef;
}

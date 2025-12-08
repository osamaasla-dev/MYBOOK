import { useCallback, useState } from "react";

import type { PublishProgress } from "./types";

export function usePublishingProgress() {
  const [progress, setProgress] = useState<PublishProgress | null>(null);

  const updateProgress = useCallback((value: number, label: string) => {
    setProgress({ value, label });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return { progress, updateProgress, resetProgress };
}

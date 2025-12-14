"use client";

import { useCallback, useRef } from "react";

import { recordPostViewApi } from "../services/client";
import type { RecordPostViewResponse } from "../types";

type RecordPostViewOptions = {
  postId: string | null;
  debounceMs?: number;
  onSuccess?: (data: RecordPostViewResponse) => void;
  onError?: (error: Error) => void;
};

export function useRecordPostView({
  postId,
  debounceMs = 1000,
  onSuccess,
  onError,
}: RecordPostViewOptions) {
  const lastTriggeredAt = useRef<number>(0);

  return useCallback(async () => {
    if (!postId) return;

    const now = Date.now();
    if (now - lastTriggeredAt.current < debounceMs) {
      return;
    }

    lastTriggeredAt.current = now;

    try {
      const data = await recordPostViewApi(postId);
      onSuccess?.(data);
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Failed to record view");
      onError?.(err);
    }
  }, [postId, debounceMs, onSuccess, onError]);
}

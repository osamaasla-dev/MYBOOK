"use client";

import { useEffect, useRef } from "react";
import { useRecordPostView } from "../useRecordPostView";

type UsePostViewObserverOptions = {
  postId: string | null;
  dwellMs?: number;
  threshold?: number;
};

type UsePostViewObserverResult = {
  targetRef: React.RefObject<HTMLElement | null>;
};

const DEFAULT_DWELL_MS = 3_000;
const DEFAULT_THRESHOLD = 0.5;

export function usePostViewObserver({
  postId,
  dwellMs = DEFAULT_DWELL_MS,
  threshold = DEFAULT_THRESHOLD,
}: UsePostViewObserverOptions): UsePostViewObserverResult {
  const targetRef = useRef<HTMLElement | null>(null);
  const hasRecordedRef = useRef(false);
  const recordPostView = useRecordPostView({ postId });

  useEffect(() => {
    const element = targetRef.current;
    if (!element || hasRecordedRef.current || !postId) {
      return;
    }

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry || hasRecordedRef.current) {
          return;
        }

        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          if (!dwellTimer) {
            dwellTimer = setTimeout(() => {
              hasRecordedRef.current = true;
              recordPostView().catch(() => {
                hasRecordedRef.current = false;
              });
              observer.disconnect();
            }, dwellMs);
          }
        } else if (dwellTimer) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      },
      {
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
      }
      observer.disconnect();
    };
  }, [postId, recordPostView, threshold, dwellMs]);

  return { targetRef };
}

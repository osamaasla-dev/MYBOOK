"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function usePostDetailsModalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPostIdParam = useCallback(
    (nextPostId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPostId) {
        params.set("postId", nextPostId);
      } else {
        params.delete("postId");
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const openPostDetails = useCallback(
    (postId: string) => {
      if (!postId) return;
      setPostIdParam(postId);
    },
    [setPostIdParam]
  );

  const closePostDetails = useCallback(() => {
    setPostIdParam(null);
  }, [setPostIdParam]);

  const currentPostId = searchParams.get("postId");

  return {
    openPostDetails,
    closePostDetails,
    currentPostId,
    isPostDetailsOpen: Boolean(currentPostId),
  };
}

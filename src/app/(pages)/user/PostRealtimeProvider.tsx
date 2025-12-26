"use client";

import { ReactNode, useMemo } from "react";

import { usePostRealtime } from "@/features/parts/post/hooks/usePostRealtime";
import { usePostDetailsModalNavigation } from "@/features/parts/postDetails/hooks/ui/usePostDetailsModalNavigation";

type PostRealtimeProviderProps = {
  children: ReactNode;
};

export function PostRealtimeProvider({ children }: PostRealtimeProviderProps) {
  const { currentPostId } = usePostDetailsModalNavigation();

  const realtimeOptions = useMemo(
    () => ({
      postId: currentPostId ?? undefined,
      enableUserChannel: true,
      enablePostDetailChannel: Boolean(currentPostId),
    }),
    [currentPostId]
  );

  usePostRealtime(realtimeOptions);

  return <>{children}</>;
}

"use client";

import { useCallback } from "react";

import { usePusherChannel } from "@/hooks/usePusherChannel";

export function useNotificationsRealtime(
  channelName: string,
  enabled: boolean,
  onInvalidate: () => void
) {
  const handler = useCallback(() => {
    onInvalidate();
  }, [onInvalidate]);

  usePusherChannel({
    channelName,
    event: "follow:added",
    enabled,
    onEvent: handler,
  });

  usePusherChannel({
    channelName,
    event: "follow:removed",
    enabled,
    onEvent: handler,
  });

  usePusherChannel({
    channelName,
    event: "follow:requested",
    enabled,
    onEvent: handler,
  });

  usePusherChannel({
    channelName,
    event: "follow:approved",
    enabled,
    onEvent: handler,
  });

  usePusherChannel({
    channelName,
    event: "follow:rejected",
    enabled,
    onEvent: handler,
  });
}

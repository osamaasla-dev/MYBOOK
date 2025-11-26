"use client";

import { useCallback } from "react";

import { usePusherChannel } from "@/hooks/usePusherChannel";

const NOTIFICATION_EVENTS = [
  "follow:added",
  "follow:removed",
  "follow:requested",
  "follow:approved",
  "follow:rejected",
  "follow:canceled",
  "friend:request",
  "friend:canceled",
  "friend:accepted",
  "friend:rejected",
] as const;

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
    enabled,
    bindings: NOTIFICATION_EVENTS.map((event) => ({
      event,
      onEvent: handler,
    })),
  });
}

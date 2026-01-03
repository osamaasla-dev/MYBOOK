"use client";

import { useCallback } from "react";

import { usePusherChannel } from "@/hooks/usePusherChannel";
import { NOTIFICATION_EVENTS } from "../../constants";

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

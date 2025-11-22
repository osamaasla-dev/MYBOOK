"use client";

import { useEffect } from "react";

import { getPusherClient } from "@/lib/pusher/client";

export type UsePusherChannelOptions<TPayload = unknown> = {
  channelName: string;
  event: string;
  onEvent: (payload: TPayload) => void;
  enabled?: boolean;
};

/**
 * Subscribes to a Pusher channel/event pair and automatically cleans up.
 */
export function usePusherChannel<TPayload = unknown>({
  channelName,
  event,
  onEvent,
  enabled = true,
}: UsePusherChannelOptions<TPayload>) {
  useEffect(() => {
    if (!enabled || !channelName || !event) {
      return;
    }

    const client = getPusherClient();
    const channel = client.subscribe(channelName);
    const handler = (data: TPayload) => {
      onEvent(data);
    };

    channel.bind(event, handler);

    return () => {
      channel.unbind(event, handler);
      client.unsubscribe(channelName);
    };
  }, [channelName, event, enabled, onEvent]);
}

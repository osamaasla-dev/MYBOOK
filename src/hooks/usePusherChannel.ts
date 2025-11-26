"use client";

import { useEffect, useMemo } from "react";

import type { Channel } from "pusher-js";

import { getPusherClient } from "@/lib/pusher/client";

type ChannelRegistryEntry = {
  channel: Channel;
  refCount: number;
};

const channelRegistry = new Map<string, ChannelRegistryEntry>();

function acquireChannel(channelName: string): Channel {
  const client = getPusherClient();
  const existing = channelRegistry.get(channelName);

  if (existing) {
    existing.refCount += 1;
    return existing.channel;
  }

  const channel = client.subscribe(channelName);
  channelRegistry.set(channelName, { channel, refCount: 1 });
  return channel;
}

function releaseChannel(channelName: string) {
  const entry = channelRegistry.get(channelName);

  if (!entry) {
    return;
  }

  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    channelRegistry.delete(channelName);
    const client = getPusherClient();
    client.unsubscribe(channelName);
  }
}

export type UsePusherBinding<TPayload = unknown> = {
  event: string;
  onEvent: (payload: TPayload) => void;
};

type SingleBindingOptions<TPayload = unknown> = {
  channelName: string;
  event: string;
  onEvent: (payload: TPayload) => void;
  enabled?: boolean;
};

type MultiBindingOptions<TPayload = unknown> = {
  channelName: string;
  bindings: UsePusherBinding<TPayload>[];
  enabled?: boolean;
};

export type UsePusherChannelOptions<TPayload = unknown> =
  | SingleBindingOptions<TPayload>
  | MultiBindingOptions<TPayload>;

/**
 * Subscribes to a Pusher channel/event pair and automatically cleans up.
 */
export function usePusherChannel<TPayload = unknown>(
  options: UsePusherChannelOptions<TPayload>
) {
  const { channelName, enabled = true } = options;

  const bindings = useMemo<UsePusherBinding<TPayload>[]>(() => {
    if ("bindings" in options) {
      return options.bindings;
    }

    return [
      {
        event: options.event,
        onEvent: options.onEvent,
      },
    ];
  }, [options]);

  useEffect(() => {
    if (!enabled || !channelName || bindings.length === 0) {
      return;
    }

    const channel = acquireChannel(channelName);
    const boundHandlers = bindings.map(({ event, onEvent }) => {
      const handler = (data: TPayload) => {
        onEvent(data);
      };
      channel.bind(event, handler);
      return { event, handler };
    });

    return () => {
      boundHandlers.forEach(({ event, handler }) => {
        channel.unbind(event, handler);
      });
      releaseChannel(channelName);
    };
  }, [bindings, channelName, enabled]);
}

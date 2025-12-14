"use client";

import { useMemo } from "react";

import { useCurrentUser } from "@/features/hooks";
import { buildUserChannel } from "@/features/utils/realtime";
import {
  usePusherChannel,
  type UsePusherBinding,
} from "@/hooks/usePusherChannel";

import { buildFollowToastBindings } from "./followToastBindings";
import { buildFriendToastBindings } from "./friendToastBindings";
import { buildPostToastBindings } from "./postToastBindings";

type ToastBindingFactory = () => UsePusherBinding<unknown>[];

const TOAST_BINDING_FACTORIES: ToastBindingFactory[] = [
  buildFollowToastBindings,
  buildFriendToastBindings,
  buildPostToastBindings,
];

export function useRealtimeNotificationToasts() {
  const { data: currentUser } = useCurrentUser();

  const bindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    return TOAST_BINDING_FACTORIES.flatMap((factory) => {
      try {
        return factory();
      } catch (error) {
        console.error("Failed to build notification toast bindings", error);
        return [];
      }
    });
  }, []);

  const channelName = currentUser?.id ? buildUserChannel(currentUser.id) : "";

  usePusherChannel({
    channelName,
    bindings,
    enabled: Boolean(channelName && bindings.length),
  });
}

"use client";

import toast from "react-hot-toast";

import type { UsePusherBinding } from "@/hooks/usePusherChannel";

import type { FriendRealtimePayload } from "../../../addFriend/utils/realtime";
import {
  FRIEND_EVENTS,
  type FriendEventName,
} from "../../../addFriend/hooks/realtime/friendRealtimeEvents";

type ToastHandler = (message: string) => string | number;
type ToastMessageBuilder = (payload: FriendRealtimePayload) => string;

const EVENT_TOASTERS: Partial<Record<FriendEventName, ToastHandler>> = {
  [FRIEND_EVENTS.REQUEST]: toast.success,
  [FRIEND_EVENTS.ACCEPTED]: toast.success,
};

const EVENT_MESSAGES: Partial<Record<FriendEventName, ToastMessageBuilder>> = {
  [FRIEND_EVENTS.REQUEST]: (payload) =>
    `${payload.requesterName ?? "Someone"} sent you a friend request`,
  [FRIEND_EVENTS.ACCEPTED]: (payload) =>
    `${payload.requesterName ?? "Someone"} accepted your friend request`,
};

const FRIEND_TOAST_EVENT_ORDER: FriendEventName[] = [
  FRIEND_EVENTS.REQUEST,
  FRIEND_EVENTS.ACCEPTED,
];

export function buildFriendToastBindings(): UsePusherBinding<unknown>[] {
  return FRIEND_TOAST_EVENT_ORDER.map<UsePusherBinding<unknown>>((event) => ({
    event,
    onEvent: (payload) => {
      showFriendToast(event, payload as FriendRealtimePayload);
    },
  }));
}

export function showFriendToast(
  eventName: FriendEventName,
  payload: FriendRealtimePayload
) {
  const trigger = EVENT_TOASTERS[eventName];
  const buildMessage = EVENT_MESSAGES[eventName];
  if (!trigger || !buildMessage) {
    return;
  }

  const message = buildMessage(payload);
  trigger(message);
}

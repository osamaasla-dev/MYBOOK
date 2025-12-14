"use client";

import toast from "react-hot-toast";

import type { UsePusherBinding } from "@/hooks/usePusherChannel";

import type { FollowRealtimePayload } from "../../../follow/utils/realtime";
import {
  FOLLOW_EVENTS,
  type FollowEventName,
} from "../../../follow/hooks/realtime/followRealtimeEvents";

type ToastHandler = (message: string) => string | number;
type ToastMessageBuilder = (payload: FollowRealtimePayload) => string;

const EVENT_TOASTERS: Partial<Record<FollowEventName, ToastHandler>> = {
  [FOLLOW_EVENTS.APPROVED]: toast.success,
  [FOLLOW_EVENTS.FOLLOW_ADDED]: toast.success,
  [FOLLOW_EVENTS.FOLLOW_REQUESTED]: toast.success,
};

const EVENT_MESSAGES: Partial<Record<FollowEventName, ToastMessageBuilder>> = {
  [FOLLOW_EVENTS.APPROVED]: (payload) =>
    `${payload.followerName ?? "Someone"} accepted your follow request`,
  [FOLLOW_EVENTS.FOLLOW_ADDED]: (payload) =>
    `${payload.followerName ?? "Someone"} started following you`,
  [FOLLOW_EVENTS.FOLLOW_REQUESTED]: (payload) =>
    `${payload.followerName ?? "Someone"} requested to follow you`,
};

const FOLLOW_TOAST_EVENT_ORDER: FollowEventName[] = [
  FOLLOW_EVENTS.FOLLOW_REQUESTED,
  FOLLOW_EVENTS.FOLLOW_ADDED,
  FOLLOW_EVENTS.APPROVED,
];

export function buildFollowToastBindings(): UsePusherBinding<unknown>[] {
  return FOLLOW_TOAST_EVENT_ORDER.map<UsePusherBinding<unknown>>((event) => ({
    event,
    onEvent: (payload) =>
      showFollowToast(event, payload as FollowRealtimePayload),
  }));
}

export function showFollowToast(
  eventName: FollowEventName,
  payload: FollowRealtimePayload
) {
  const trigger = EVENT_TOASTERS[eventName];
  const buildMessage = EVENT_MESSAGES[eventName];
  if (!trigger || !buildMessage) {
    return;
  }

  const message = buildMessage(payload);
  trigger(message);
}

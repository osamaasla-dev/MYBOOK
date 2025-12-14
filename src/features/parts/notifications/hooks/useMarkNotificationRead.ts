"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateNotificationTabQueries } from "./notificationQueryUtils";
import { markNotificationAsReadRequest } from "../services/client";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await markNotificationAsReadRequest(notificationId);
    },

    onSuccess: () => {
      invalidateNotificationTabQueries(queryClient);
    },
  });
}

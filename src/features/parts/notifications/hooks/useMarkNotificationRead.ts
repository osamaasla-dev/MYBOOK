"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markNotificationAsReadRequest } from "../services";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: markNotificationAsReadRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", { unreadOnly: false }],
      });
    },
  });

  return mutation;
}

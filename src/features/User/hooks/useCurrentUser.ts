"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services";
import type { CurrentUser } from "../types";

export const CURRENT_USER_QK = ["current-user"] as const;

export function useCurrentUser(enabled?: boolean) {
  return useQuery<CurrentUser, Error>({
    queryKey: CURRENT_USER_QK,
    queryFn: getCurrentUser,
    staleTime: 60 * 1000,
    gcTime: 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: enabled ?? true,
  });
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getProfileByUsername } from "../services/client";
import type { ProfileRouteData } from "../types";

export const profileQueryKey = (username: string) =>
  ["profile", username] as const;

export function useProfile(username: string, enabled = true) {
  return useQuery<ProfileRouteData, Error>({
    queryKey: profileQueryKey(username),
    queryFn: async () => getProfileByUsername(username),
    enabled: Boolean(username && enabled),
    staleTime: 60 * 1000,
    gcTime: 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
}

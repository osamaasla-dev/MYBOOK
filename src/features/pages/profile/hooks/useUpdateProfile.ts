import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCurrentUserProfile } from "../services/client";
import type { UpdateProfileInput } from "../schemas";
import type { ProfileRouteData, ProfileUserRecord } from "../types";
import { profileQueryKey } from "./useProfile";
import { CURRENT_USER_QK } from "@/features/hooks";
import { CurrentUser } from "@/features/types";
import toast from "react-hot-toast";

export const UPDATE_PROFILE_MUTATION_KEY = ["profile", "update"] as const;

type UpdateProfileContext = {
  previousProfile?: ProfileRouteData;
  previousUser?: CurrentUser;
};

export function useUpdateProfile(userId: string, username: string) {
  const queryClient = useQueryClient();

  // Use username instead of userId to match useProfile query key
  const profileKey = profileQueryKey(username);

  return useMutation<
    Partial<ProfileUserRecord>,
    Error,
    UpdateProfileInput,
    UpdateProfileContext
  >({
    mutationKey: UPDATE_PROFILE_MUTATION_KEY,
    mutationFn: (data) => {
      if (!userId) throw new Error("User ID is required");
      return updateCurrentUserProfile(data);
    },
    onMutate: async () => {
      toast.loading("Updating profile...");
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKey });
      await queryClient.cancelQueries({ queryKey: CURRENT_USER_QK });
      // Snapshot the previous value
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(profileKey);
      const previousUser =
        queryClient.getQueryData<CurrentUser>(CURRENT_USER_QK);

      // Return a context object with the snapshotted value
      return { previousProfile, previousUser };
    },
    onSuccess: (newData) => {
      toast.success("Profile updated successfully");
      // Optimistically update to the new value
      queryClient.setQueryData<ProfileRouteData>(profileKey, (old) => ({
        ...old!,
        profile: {
          ...old!.profile,
          ...newData,
        },
        updatedAt: new Date(),
      }));
      queryClient.setQueryData<CurrentUser>(CURRENT_USER_QK, (old) => ({
        ...old!,
        avatarUrl: newData.avatarUrl ?? null,
      }));
    },
    onError: (_error, _newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData<ProfileRouteData>(
          profileKey,
          context.previousProfile
        );
      }
      if (context?.previousUser) {
        queryClient.setQueryData<CurrentUser>(
          CURRENT_USER_QK,
          context.previousUser
        );
      }
    },
  });
}

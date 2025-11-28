"use client";

import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  unFriendApi,
  type UnFriendApiResponse,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { RelationTab } from "@/features/pages/relations/types";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";

export type UseUnFriendArgs = {
  profileUsername: string;
};
const RELATION_TABS_ON_ACCEPT: RelationTab[] = [
  "friends",
  "followers",
  "following",
];

export const unFriendMutationKey = (profileUsername: string) =>
  ["friend-request", "remove", profileUsername] as const;

export function useUnFriend({ profileUsername }: UseUnFriendArgs) {
  const queryClient = useQueryClient();

  return useMutation<UnFriendApiResponse, Error, void>({
    mutationKey: unFriendMutationKey(profileUsername),
    mutationFn: () => unFriendApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingUnFriend);
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.unFriendSuccess);
      notifyManager.batch(() => {
        queryClient.invalidateQueries({
          queryKey: profileQueryKey(profileUsername),
        });

        RELATION_TABS_ON_ACCEPT.forEach((tab) =>
          queryClient.invalidateQueries({ queryKey: relationsQueryKey(tab) })
        );
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? friendMessages.FEEDBACK.unFriendFailure);
    },
  });
}

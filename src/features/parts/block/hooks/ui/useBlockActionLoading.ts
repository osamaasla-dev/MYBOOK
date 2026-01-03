import { useMutationState } from "@tanstack/react-query";
import { useBlockUser, useUnblockUser } from "../";
import { BLOCK_MUTATION_KEY, UNBLOCK_MUTATION_KEY } from "../";

export function useBlockActionLoading(profileUsername: string) {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const blockPending = useBlockActionPending(
    profileUsername,
    BLOCK_MUTATION_KEY
  );
  const unblockPending = useBlockActionPending(
    profileUsername,
    UNBLOCK_MUTATION_KEY
  );

  const isBlocking = blockMutation.isPending || blockPending.length > 0;
  const isUnblocking = unblockMutation.isPending || unblockPending.length > 0;

  return {
    blockMutation,
    unblockMutation,
    isBlocking,
    isUnblocking,
  };
}

function useBlockActionPending(
  username: string,
  mutationKey: readonly unknown[]
) {
  return useMutationState({
    filters: {
      mutationKey,
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | { username: string }
          | undefined;
        return variables?.username === username;
      },
    },
  });
}

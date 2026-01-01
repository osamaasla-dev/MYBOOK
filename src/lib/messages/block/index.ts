const blockMessages = {
  FEEDBACK: {
    loading: "Blocking user…",
    success: "User blocked successfully",
    failure: "Failed to block user",
    unblocked: "User unblocked successfully",
    unblocking: "Unblocking user…",
    unblockFailure: "Failed to unblock user",
  },
  ERRORS: {
    unauthorized: "BLOCK_UNAUTHORIZED",
    rateLimited: "BLOCK_RATE_LIMITED",
    targetNotFound: "BLOCK_TARGET_NOT_FOUND",
    selfBlock: "BLOCK_SELF_NOT_ALLOWED",
    alreadyBlocked: "BLOCK_ALREADY_EXISTS",
    notBlocked: "BLOCK_NOT_FOUND",
    unexpected: "BLOCK_FAILED",
  },
};

export default blockMessages;

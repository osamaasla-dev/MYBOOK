const followMessages = {
  FOLLOW_ERRORS: {
    blocked: "FOLLOW_BLOCKED",
    alreadyFollowing: "FOLLOW_ALREADY_EXISTS",
    selfFollow: "FOLLOW_SELF_NOT_ALLOWED",
    notFollowing: "FOLLOW_NOT_FOUND",
    noPendingRequest: "FOLLOW_REQUEST_NOT_FOUND",
  },
  FEEDBACK: {
    loadingFollow: "Following user…",
    loadingUnfollow: "Unfollowing user…",
    loadingCancelRequest: "Canceling follow request…",
    followSuccess: "Followed successfully",
    unfollowSuccess: "Unfollowed successfully",
    cancelRequestSuccess: "Follow request canceled",
    followFailure: "Failed to follow user",
    unfollowFailure: "Failed to unfollow user",
    cancelRequestFailure: "Failed to cancel follow request",
    acceptRequestSuccess: "Follow request accepted",
    acceptRequestFailure: "Failed to accept follow request",
    rejectRequestSuccess: "Follow request rejected",
    rejectRequestFailure: "Failed to reject follow request",
  },
};

export default followMessages;

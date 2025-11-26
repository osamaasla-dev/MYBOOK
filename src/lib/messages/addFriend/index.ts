const friendMessages = {
  FRIEND_ERRORS: {
    blocked: "FRIEND_BLOCKED",
    selfFriend: "FRIEND_SELF_NOT_ALLOWED",
    alreadyFriends: "FRIEND_ALREADY_EXISTS",
    notFriends: "FRIEND_NOT_FOUND",
    outgoingRequestPending: "FRIEND_REQUEST_ALREADY_PENDING",
    incomingRequestPending: "FRIEND_REQUEST_ALREADY_EXISTS",
    noPendingRequest: "FRIEND_REQUEST_NOT_FOUND",
  },
  FEEDBACK: {
    loadingRequest: "Sending friend request…",
    requestSuccess: "Friend request sent",
    requestFailure: "Failed to send friend request",
    loadingCancelRequest: "Canceling friend request…",
    cancelRequestSuccess: "Friend request canceled",
    cancelRequestFailure: "Failed to cancel friend request",
    loadingAcceptRequest: "Accepting friend request…",
    acceptRequestSuccess: "Friend request accepted",
    acceptRequestFailure: "Failed to accept friend request",
    loadingRejectRequest: "Rejecting friend request…",
    rejectRequestSuccess: "Friend request rejected",
    rejectRequestFailure: "Failed to reject friend request",
    loadingRemoveFriend: "Removing friend…",
    removeFriendSuccess: "Friend removed",
    removeFriendFailure: "Failed to remove friend",
  },
};

export default friendMessages;

const commentMessages = {
  created: "Comment added successfully.",
  deleted: "Comment deleted successfully.",
  updated: "Comment updated successfully.",
  fetched: "Comments fetched successfully.",
  unauthorized: "You must be signed in before adding a comment.",
  invalidPayload: "Invalid payload for comment operation.",
  unexpectedError: "An unexpected error occurred while processing the comment.",
  blocked: "You cannot interact with this user.",
  postNotFound: "Post not found.",
  commentNotFound: "Comment not found.",
  parentNotFound: "The comment you are replying to was not found.",
  invalidParent:
    "The comment you are replying to does not belong to this post.",
  forbidden: "You are not allowed to perform this action on the comment.",
  moderationRejected: "Your comment violates our guidelines. Please revise it.",
  reactionAlreadyExists: "You have already reacted to this comment.",
  validation: {
    contentRequired: "Comment cannot be empty.",
    contentTooLong: "Comment is too long.",
    replyToReply:
      "Nested replies are not allowed. You can only reply to main comments.",
  },
};

export default commentMessages;

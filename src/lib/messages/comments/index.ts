const commentMessages = {
  created: "Comment added successfully.",
  fetched: "Comments fetched successfully.",
  unauthorized: "You must be signed in before adding a comment.",
  invalidPayload: "Invalid payload for creating a comment.",
  unexpectedError: "An unexpected error occurred while adding the comment.",
  blocked: "You cannot interact with this user.",
  postNotFound: "Post not found.",
  parentNotFound: "The comment you are replying to was not found.",
  invalidParent:
    "The comment you are replying to does not belong to this post.",
  moderationRejected: "Your comment violates our guidelines. Please revise it.",
  validation: {
    contentRequired: "Comment cannot be empty.",
    contentTooLong: "Comment is too long.",
  },
};

export default commentMessages;

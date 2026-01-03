const postMessages = {
  created: "Post published successfully.",
  unauthorized: "You must be signed in before creating a post.",
  invalidPayload: "Invalid payload for creating a post.",
  unexpectedError: "An unexpected error occurred while creating the post.",
  notFound: "Post not found",
  delete: {
    success: "Post deleted successfully",
    invalidParams: "Invalid postId parameter",
    notAuthorized: "User is not authorized to delete this post",
    failed: "Failed to delete post",
  },
  update: {
    success: "Post updated successfully",
    invalidParams: "Invalid postId parameter",
    notAuthorized: "User is not authorized to update this post",
    failed: "Failed to update post",
  },
  reactions: {
    fetchSuccess: "Post reactions fetched successfully",
    fetchFailed: "Failed to fetch post reactions",
    invalidParams: "Invalid parameters for fetching reactions",
    notFound: "Post reactions not found",
    deleteSuccess: "Post reaction deleted successfully",
    deleteFailed: "Failed to delete post reaction",
  },
  details: {
    fetchSuccess: "Post details fetched successfully",
    fetchFailed: "Failed to fetch post details",
    invalidParams: "Invalid postId parameter",
    notFound: "Post not found",
  },
  validation: {
    contentRequired: "Post content cannot be empty.",
    contentTooLong: "Post content is too long.",
    mediaLimit: "You can attach up to 10 media items only.",
    contentOrMediaRequired: "Add text or media before publishing the post.",
  },
  PUBLISHING_MESSAGES: {
    missingContentOrMedia: "Please add text or media before publishing.",
    textRejected:
      "Your text appears to violate our guidelines. Please revise it.",
    mediaRejected:
      "One of your media files was flagged. Please remove it and try again.",
    mediaMissingAsset:
      "We couldn't process one of your media files. Please try again.",
    genericFailure: "Unable to publish your post right now. Please try again.",
  },
};

export default postMessages;

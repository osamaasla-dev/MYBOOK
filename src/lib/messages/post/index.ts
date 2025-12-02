const postMessages = {
  created: "Post published successfully.",
  unauthorized: "You must be signed in before creating a post.",
  invalidPayload: "Invalid payload for creating a post.",
  unexpectedError: "An unexpected error occurred while creating the post.",
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

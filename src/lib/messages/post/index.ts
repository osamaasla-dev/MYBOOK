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
};

export default postMessages;

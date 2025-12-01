const moderationMessages = {
  success: "Content cleared moderation successfully.",
  blocked: "Content violates moderation guidelines.",
  invalidPayload: "Invalid payload for moderation check.",
  missingKey: "OpenAI API key is not configured on the server.",
  rateLimited: "Moderation service rate limit reached, please retry shortly.",
  failed: "Unable to complete moderation at this time.",
  validation: {
    contentRequired: "Content cannot be empty.",
    contentTooLong: "Content is too long.",
  },
};

export default moderationMessages;

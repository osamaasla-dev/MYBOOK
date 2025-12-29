const profileMessages = {
  PRIVATE_PROFILE_MESSAGE:
    "This profile is private. Follow the account to view more details.",
  PENDING_FOLLOW_MESSAGE:
    "Your follow request is pending approval. You'll gain access once it is accepted.",
  BLOCKED_PROFILE_MESSAGE: "This profile isn't available.",
  update: {
    success: "Profile updated successfully",
    failed: "Failed to update profile",
    unauthorized: "Profile update attempted without authentication",
    rateLimitExceeded: "Too many update attempts. Please try again later.",
    invalidPayload: "Invalid profile data",
    bioBlocked: "Bio content is not allowed",
    avatarBlocked: "Avatar image is not allowed",
    coverBlocked: "Cover image is not allowed",
    moderationUnavailable: "Content moderation service unavailable",
    moderationError: "Content moderation service error",
    unexpectedError: "An unexpected error occurred while updating profile",
  },
  delete: {
    success: "Profile fields deleted successfully",
    failed: "Failed to delete profile fields",
    unauthorized: "Profile delete attempted without authentication",
    rateLimitExceeded: "Too many delete attempts. Please try again later.",
    invalidPayload: "Invalid delete request",
    noFieldsSpecified: "No fields specified for deletion",
    invalidFields: "Invalid fields specified for deletion",
    unexpectedError:
      "An unexpected error occurred while deleting profile fields",
  },
};

export default profileMessages;

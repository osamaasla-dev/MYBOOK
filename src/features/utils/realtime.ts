export const USER_CHANNEL_PREFIX = "private-user-";

export const buildUserChannel = (userId: string) =>
  `${USER_CHANNEL_PREFIX}${userId}`;

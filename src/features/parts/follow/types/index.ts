export type FollowActionInput = {
  username: string;
};

export type FollowApiResponse = {
  message: string;
  status: "FOLLOWED" | "UNFOLLOWED";
};

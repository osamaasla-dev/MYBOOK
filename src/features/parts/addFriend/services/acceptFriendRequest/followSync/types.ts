export type FollowSyncResult = {
  followerId: string;
  followerUsername: string;
  targetId: string;
  targetUsername: string;
  createdFollow: boolean;
  acceptedRequestId?: string;
};

export type SyncParticipant = {
  id: string;
  username: string;
};

export type SyncMutualFollowsArgs = {
  viewer: SyncParticipant;
  requester: SyncParticipant;
};

export type FollowSyncArgs = {
  followerId: string;
  followerUsername: string;
  targetId: string;
  targetUsername: string;
};

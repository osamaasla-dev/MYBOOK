export type FollowSyncResult = {
  followerId: string;
  followerUsername: string;
  followerName: string;
  targetId: string;
  targetUsername: string;
  targetName: string;
  createdFollow: boolean;
  acceptedRequestId?: string;
};

export type SyncParticipant = {
  id: string;
  username: string;
  name: string;
};

export type SyncMutualFollowsArgs = {
  viewer: SyncParticipant;
  requester: SyncParticipant;
};

export type FollowSyncArgs = {
  followerId: string;
  followerUsername: string;
  followerName: string;
  targetId: string;
  targetUsername: string;
  targetName: string;
};

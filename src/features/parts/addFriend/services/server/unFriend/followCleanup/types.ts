export type RemovedFollow = {
  followerId: string;
  followerUsername: string;
  targetId: string;
  targetUsername: string;
};

export type CanceledFollowRequest = {
  requesterId: string;
  requesterUsername: string;
  receiverId: string;
  receiverUsername: string;
  requestId: string;
};

export type FollowCleanupResult = {
  removedFollows: RemovedFollow[];
  canceledRequests: CanceledFollowRequest[];
};

export type RemoveFollowDirectionInput = {
  followerId: string;
  targetId: string;
};

export type CancelFollowRequestDirectionInput = {
  requesterId: string;
  requesterUsername: string;
  receiverId: string;
  receiverUsername: string;
};

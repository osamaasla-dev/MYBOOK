export const POST_SHARE_EVENT = "post:share" as const;

export type PostShareEventPayload = {
  postId: string;
  shareId: string;
  sharedById: string;
  sharedByName: string;
  channel: string;
  message?: string | null;
};

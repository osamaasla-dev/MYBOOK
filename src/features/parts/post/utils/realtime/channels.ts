export const POST_CREATED_EVENT = "post:created";

export const POST_DETAIL_REACTION_EVENT = "post:reaction";
export const POST_DETAIL_COMMENT_EVENT = "comment:create";
export const POST_DETAIL_COMMENT_UPDATED_EVENT = "comment:updated";
export const POST_DETAIL_SHARE_EVENT = "share:create";
export const POST_DETAIL_META_EVENT = "post:meta";
export const POST_DETAIL_COMMENT_DELETED_EVENT = "comment:deleted";
export const POST_DETAIL_COMMENT_REACTION_EVENT = "comment:reaction";
export const POST_DETAIL_COMMENT_META_EVENT = "comment:meta";

export const buildPostDetailChannel = (postId: string) => `posts-${postId}`;

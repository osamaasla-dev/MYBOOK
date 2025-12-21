export const POST_CREATED_EVENT = "post:created";

export const POST_DETAIL_REACTION_EVENT = "posts:detail:reaction";
export const POST_DETAIL_COMMENT_EVENT = "posts:detail:comment:create";
export const POST_DETAIL_REPLY_EVENT = "posts:detail:reply:create";
export const POST_DETAIL_SHARE_EVENT = "posts:detail:share:create";
export const POST_DETAIL_META_EVENT = "posts:detail:meta";
export const POST_DETAIL_COMMENT_DELETED_EVENT = "posts:detail:comment:deleted";

export const buildPostDetailChannel = (postId: string) => `posts-${postId}`;

export const POST_CREATED_EVENT = "post:created";

export const POST_DETAIL_REACTION_EVENT = "posts:detail:reaction";
export const POST_DETAIL_COMMENT_EVENT = "posts:detail:comment";
export const POST_DETAIL_REPLY_EVENT = "posts:detail:reply";
export const POST_DETAIL_SHARE_EVENT = "posts:detail:share";
export const POST_DETAIL_META_EVENT = "posts:detail:meta";

export const buildPostDetailChannel = (postId: string) => `posts-${postId}`;

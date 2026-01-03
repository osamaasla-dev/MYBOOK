// Post creation rate limiting constants
export const POST_CREATE_RATE_NAMESPACE = "post:create:rl";
export const POST_CREATE_RATE_WINDOW_SECONDS = 60; // 1 minute
export const POST_CREATE_RATE_MAX = 5; // 5 posts per minute

export const POST_REACTION_RATE_NAMESPACE = "post:reaction:rl";
export const POST_REACTION_WINDOW_MS = 60;
export const POST_REACTION_MAX_ACTIONS = 20;

export const POST_UPDATE_RATE_NAMESPACE = "post:update:rl";
export const POST_UPDATE_RATE_WINDOW_SECONDS = 60; // 1 minute
export const POST_UPDATE_RATE_MAX = 10; // 10 updates per minute

export const POST_DELETE_RATE_NAMESPACE = "post:delete:rl";
export const POST_DELETE_RATE_WINDOW_SECONDS = 60; // 1 minute
export const POST_DELETE_RATE_MAX = 10; // 10 updates per minute

export const POST_VIEW_RATE_NAMESPACE = "post:view:rl";
export const POST_VIEW_WINDOW_MS = 60;
export const POST_VIEW_MAX_ACTIONS = 10;

export const POST_VIEWS_QUEUE_KEY = "post:views:pending";
export const POST_VIEW_LOCK_NAMESPACE = "post:views:lock";
export const POST_VIEW_LOCK_TTL_SECONDS = 60;
export const POST_VIEW_RATE_LIMIT_NAMESPACE = "post:views:rl";
export const POST_VIEW_RATE_LIMIT_WINDOW_SECONDS = 60;
export const POST_VIEW_RATE_LIMIT_MAX = 100;

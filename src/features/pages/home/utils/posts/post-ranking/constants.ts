export const IMPORTANT_USER_POST_WINDOW_DAYS = 7;
export const MAX_POSTS_PER_USER = 3;
export const MAX_TOTAL_POSTS = 60;
export const DEFAULT_FEED_PAGE_SIZE = 20;

export const POST_HALF_LIFE_HOURS = 48; // posts decay faster than relationships
export const ENGAGEMENT_LIKE_WEIGHT = 1;
export const ENGAGEMENT_COMMENT_WEIGHT = 5;
export const ENGAGEMENT_SHARE_WEIGHT = 15;
export const ENGAGEMENT_VIEW_WEIGHT = 0.1;

export const VIEWER_LIKE_BOOST = 20;
export const VIEWER_COMMENT_BOOST = 40;
export const VIEWER_SHARE_BOOST = 70;

export const RANKED_POSTS_CACHE_NAMESPACE = "feed:posts";
export const RANKED_POSTS_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

export const RANKED_POSTS_STALE_MS = 60 * 1000; // 1 minute freshness window

export const FRESH_POST_WINDOW_MINUTES = 5;
export const FRESH_POST_WINDOW_MS = FRESH_POST_WINDOW_MINUTES * 60 * 1000;
export const VIEWER_FRESH_OVERRIDE_SCORE = 10_000_000;
export const IMPORTANT_FRESH_OVERRIDE_SCORE = 5_000_000;
export const TOP_IMPORTANT_PERCENTILE = 0.1;

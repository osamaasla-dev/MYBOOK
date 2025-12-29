// Profile update rate limiting constants
export const PROFILE_UPDATE_RATE_NAMESPACE = "profile:update:rl";
export const PROFILE_UPDATE_RATE_WINDOW_SECONDS = 60; // 1 minute
export const PROFILE_UPDATE_RATE_MAX = 10; // 10 updates per minute

// Profile view rate limiting constants
export const PROFILE_VIEW_RATE_NAMESPACE = "profile:view:rl";
export const PROFILE_VIEW_RATE_WINDOW_SECONDS = 60; // 1 minute
export const PROFILE_VIEW_RATE_MAX = 100; // 100 views per minute

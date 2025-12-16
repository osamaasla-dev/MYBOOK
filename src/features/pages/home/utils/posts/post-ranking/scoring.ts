import {
  ENGAGEMENT_COMMENT_WEIGHT,
  ENGAGEMENT_LIKE_WEIGHT,
  ENGAGEMENT_SHARE_WEIGHT,
  ENGAGEMENT_VIEW_WEIGHT,
  POST_HALF_LIFE_HOURS,
  VIEWER_COMMENT_BOOST,
  VIEWER_LIKE_BOOST,
  VIEWER_SHARE_BOOST,
} from "./constants";
import type { PostCandidate, RankedPost } from "./types";

const MS_PER_HOUR = 1000 * 60 * 60;

export function computePostDecayFactor(
  publishedAt: Date,
  now: Date = new Date()
) {
  const hoursSince = (now.getTime() - publishedAt.getTime()) / MS_PER_HOUR;
  if (!Number.isFinite(hoursSince) || hoursSince <= 0) return 1;

  const factor = Math.pow(0.5, hoursSince / POST_HALF_LIFE_HOURS);
  return Math.max(0, Math.min(1, factor));
}

export function computeEngagementScore(candidate: PostCandidate) {
  const { reactionsCount, commentsCount, sharesCount, viewCount } = candidate;
  return (
    reactionsCount * ENGAGEMENT_LIKE_WEIGHT +
    commentsCount * ENGAGEMENT_COMMENT_WEIGHT +
    sharesCount * ENGAGEMENT_SHARE_WEIGHT +
    viewCount * ENGAGEMENT_VIEW_WEIGHT
  );
}

export function computeViewerBoost(candidate: PostCandidate) {
  const { hasLiked, hasCommented, hasShared } = candidate.interactions;
  return (
    (hasLiked ? VIEWER_LIKE_BOOST : 0) +
    (hasCommented ? VIEWER_COMMENT_BOOST : 0) +
    (hasShared ? VIEWER_SHARE_BOOST : 0)
  );
}

export function scorePostCandidate(
  candidate: PostCandidate,
  now: Date = new Date()
): RankedPost {
  const freshnessFactor = computePostDecayFactor(candidate.publishedAt, now);
  const engagementScore = computeEngagementScore(candidate);
  const viewerBoost = computeViewerBoost(candidate);
  const finalScore =
    candidate.userScore + engagementScore * freshnessFactor + viewerBoost;

  return {
    ...candidate,
    freshnessFactor,
    engagementScore,
    viewerBoost,
    finalScore,
  };
}

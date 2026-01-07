import {
  computeEngagementScore,
  computePostDecayFactor,
  computeViewerBoost,
  scorePostCandidate,
} from "../scoring";
import type { PostCandidate } from "../types";
import type { PostVisibilityPreference, Visibility } from "@prisma/client";

const now = new Date("2025-01-01T00:00:00Z");

const makeCandidate = (
  overrides: Partial<PostCandidate> = {}
): PostCandidate => ({
  postId: "post-1",
  authorId: "author-1",
  publishedAt: new Date("2024-12-31T00:00:00Z"),
  reactionsCount: 10,
  commentsCount: 2,
  sharesCount: 1,
  viewCount: 100,
  userScore: 50,
  interactions: {
    hasLiked: true,
    hasCommented: false,
    hasShared: true,
    viewerReaction: null,
  },
  privacy: {
    visibility: "PUBLIC" as Visibility,
    visibilityPreference: "FRIENDS" as PostVisibilityPreference,
    effectiveVisibility: "PUBLIC" as Visibility,
  },
  viewerRelationship: {
    isSelf: false,
    isFriend: false,
    isFollower: false,
  },
  ...overrides,
});

describe("computePostDecayFactor", () => {
  it("returns 1 for future or current posts", () => {
    expect(computePostDecayFactor(new Date("2025-01-02T00:00:00Z"), now)).toBe(
      1
    );
    expect(computePostDecayFactor(now, now)).toBe(1);
  });

  it("decays by half every POST_HALF_LIFE_HOURS hours", () => {
    const publishedAt = new Date("2024-12-30T00:00:00Z");
    const factor = computePostDecayFactor(publishedAt, now);
    expect(factor).toBeCloseTo(0.5, 5);
  });

  it("returns 1 for invalid published dates", () => {
    expect(computePostDecayFactor(new Date(NaN), now)).toBe(1);
  });
});

describe("scorePostCandidate", () => {
  it("combines user score, engagement (with decay), and viewer boosts", () => {
    const candidate = makeCandidate();
    const ranked = scorePostCandidate(candidate, now);

    expect(ranked.engagementScore).toBe(computeEngagementScore(candidate));
    expect(ranked.viewerBoost).toBe(computeViewerBoost(candidate));
    expect(ranked.freshnessFactor).toBeCloseTo(
      computePostDecayFactor(candidate.publishedAt, now)
    );

    const expectedFinal =
      candidate.userScore +
      ranked.engagementScore * ranked.freshnessFactor +
      ranked.viewerBoost;
    expect(ranked.finalScore).toBeCloseTo(expectedFinal, 6);
  });
});

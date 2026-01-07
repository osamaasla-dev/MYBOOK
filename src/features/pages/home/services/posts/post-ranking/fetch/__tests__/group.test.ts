import { groupPostsByAuthor } from "../group";
import type { PostWithStats } from "@/features/pages/home/utils/posts/post-ranking/types";
import { Visibility, PostVisibilityPreference } from "@prisma/client";

describe("groupPostsByAuthor", () => {
  const makePost = (overrides: Partial<PostWithStats>): PostWithStats => ({
    id: `post-${Math.random()}`,
    authorId: "author-1",
    publishedAt: new Date(),
    reactionsCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewCount: 0,
    privacy: {
      visibility: Visibility.PUBLIC,
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
      effectiveVisibility: Visibility.PUBLIC,
    },
    viewerRelationship: {
      isSelf: false,
      isFriend: false,
      isFollower: false,
    },
    ...overrides,
  });

  it("groups posts per author respecting perUserLimit", () => {
    const posts: PostWithStats[] = [
      makePost({ id: "p1", authorId: "a1" }),
      makePost({ id: "p2", authorId: "a1" }),
      makePost({ id: "p3", authorId: "a1" }),
      makePost({ id: "p4", authorId: "a2" }),
    ];

    const result = groupPostsByAuthor(posts, 2);

    expect(result).toEqual([
      { authorId: "a1", posts: posts.slice(0, 2) },
      { authorId: "a2", posts: [posts[3]] },
    ]);
  });

  it("returns empty array when no posts provided", () => {
    expect(groupPostsByAuthor([], 2)).toEqual([]);
  });
});

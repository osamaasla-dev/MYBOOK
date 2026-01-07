import { PostVisibilityPreference, Visibility } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    privacySetting: {
      findUnique: jest.fn(),
    },
    userInteractionStats: {
      findMany: jest.fn(),
    },
  },
}));

const mockLog = {
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock("@/lib/logger", () => ({
  logger: {
    child: jest.fn(() => mockLog),
  },
}));

import { prisma } from "@/lib/prisma";
import { getPostNotificationRecipients } from "../recipients";

const mockUserFindUnique = jest.mocked(prisma.user.findUnique);
const mockPrivacyFindUnique = jest.mocked(prisma.privacySetting.findUnique);
const mockStatsFindMany = jest.mocked(prisma.userInteractionStats.findMany);

const expectStatsQuery = () => ({
  where: expect.objectContaining({
    userId: baseInput.authorId,
    isFriend: true,
  }),
  orderBy: { interactionWeight: "desc" },
  take: 5,
  select: { targetUserId: true },
});

const baseInput = {
  authorId: "author-1",
  visibility: Visibility.FRIENDS,
  visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
  requestId: "req-123",
  ROUTE: "/api/posts",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getPostNotificationRecipients", () => {
  it("returns empty array and warns when authorId missing", async () => {
    const result = await getPostNotificationRecipients({
      ...baseInput,
      authorId: "",
    });

    expect(result).toEqual([]);
    expect(mockLog.warn).toHaveBeenCalledWith(
      "getPostNotificationRecipients called without authorId"
    );
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("skips when author has insufficient interactions", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      totalInteractedUsers: 0,
    } as never);

    const result = await getPostNotificationRecipients(baseInput);

    expect(result).toEqual([]);
    expect(mockLog.debug).toHaveBeenCalledWith(
      { authorId: baseInput.authorId },
      "Skipping post notification recipients due to insufficient interactions"
    );
    expect(mockStatsFindMany).not.toHaveBeenCalled();
  });

  it("skips when effective visibility is not friends", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      totalInteractedUsers: 50,
    } as never);
    mockPrivacyFindUnique.mockResolvedValueOnce({
      postsVisibility: Visibility.PUBLIC,
    } as never);

    const result = await getPostNotificationRecipients(baseInput);

    expect(result).toEqual([]);
    expect(mockLog.debug).toHaveBeenCalledWith(
      {
        authorId: baseInput.authorId,
        effectiveVisibility: Visibility.PUBLIC,
      },
      "Skipping post notification recipients due to non-friend visibility"
    );
    expect(mockStatsFindMany).not.toHaveBeenCalled();
  });

  it("returns top interaction recipients respecting limit", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      totalInteractedUsers: 50,
    } as never);
    mockPrivacyFindUnique.mockResolvedValueOnce({
      postsVisibility: Visibility.FRIENDS,
    } as never);
    mockStatsFindMany.mockResolvedValueOnce([
      { targetUserId: "friend-1" },
      { targetUserId: "friend-2" },
      { targetUserId: "friend-3" },
      { targetUserId: "friend-4" },
      { targetUserId: "friend-5" },
    ] as never);

    const result = await getPostNotificationRecipients(baseInput);

    expect(result).toEqual([
      "friend-1",
      "friend-2",
      "friend-3",
      "friend-4",
      "friend-5",
    ]);

    expect(mockStatsFindMany).toHaveBeenCalledWith(expectStatsQuery());
    expect(mockLog.debug).toHaveBeenCalledWith(
      { authorId: baseInput.authorId, recipientsCount: 5 },
      "Resolved post notification recipients"
    );
  });

  it("uses input visibility when privacySetting returns null", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      totalInteractedUsers: 50,
    } as never);
    mockPrivacyFindUnique.mockResolvedValueOnce(null);
    mockStatsFindMany.mockResolvedValueOnce([
      { targetUserId: "friend-1" },
      { targetUserId: "friend-2" },
    ] as never);

    const result = await getPostNotificationRecipients({
      ...baseInput,
      visibility: Visibility.FRIENDS,
    });

    expect(result).toEqual(["friend-1", "friend-2"]);
    expect(mockStatsFindMany).toHaveBeenCalledWith(expectStatsQuery());
    expect(mockLog.debug).toHaveBeenCalledWith(
      { authorId: baseInput.authorId, recipientsCount: 2 },
      "Resolved post notification recipients"
    );
  });
});

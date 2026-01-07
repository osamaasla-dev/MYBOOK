import { PrismaTransaction } from "../../types";
import {
  ensureNotBlocked,
  ensureNotAlreadyFollowing,
  ensureCurrentlyFollowing,
  isFollowNotificationBlocked,
} from "../guards";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    block: {
      findFirst: jest.fn(),
    },
    follow: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/messages", () => ({
  followMessages: {
    FOLLOW_ERRORS: {
      blocked: "You are blocked from following this user",
      alreadyFollowing: "You are already following this user",
      notFollowing: "You are not following this user",
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("follow/utils/guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureNotBlocked", () => {
    it("should not throw when no block exists", async () => {
      (mockPrisma.block.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // viewer not blocking target
        .mockResolvedValueOnce(null); // target not blocking viewer

      await expect(
        ensureNotBlocked("viewer-123", "target-456")
      ).resolves.not.toThrow();

      expect(mockPrisma.block.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.block.findFirst).toHaveBeenNthCalledWith(1, {
        where: { blockerId: "viewer-123", blockedId: "target-456" },
        select: { id: true },
      });
      expect(mockPrisma.block.findFirst).toHaveBeenNthCalledWith(2, {
        where: { blockerId: "target-456", blockedId: "viewer-123" },
        select: { id: true },
      });
    });

    it("should throw when viewer is blocking target", async () => {
      (mockPrisma.block.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: "block-123" }) // viewer blocking target
        .mockResolvedValueOnce(null); // target not blocking viewer

      await expect(
        ensureNotBlocked("viewer-123", "target-456")
      ).rejects.toThrow("You are blocked from following this user");
    });

    it("should throw when target is blocking viewer", async () => {
      (mockPrisma.block.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // viewer not blocking target
        .mockResolvedValueOnce({ id: "block-456" }); // target blocking viewer

      await expect(
        ensureNotBlocked("viewer-123", "target-456")
      ).rejects.toThrow("You are blocked from following this user");
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database error");
      (mockPrisma.block.findFirst as jest.Mock).mockRejectedValue(dbError);

      await expect(
        ensureNotBlocked("viewer-123", "target-456")
      ).rejects.toThrow(dbError);
    });
  });

  describe("ensureNotAlreadyFollowing", () => {
    it("should not throw when not already following", async () => {
      (mockPrisma.follow.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ensureNotAlreadyFollowing("viewer-123", "target-456")
      ).resolves.not.toThrow();

      expect(mockPrisma.follow.findFirst).toHaveBeenCalledWith({
        where: { followerId: "viewer-123", followingId: "target-456" },
        select: { id: true },
      });
    });

    it("should throw when already following", async () => {
      (mockPrisma.follow.findFirst as jest.Mock).mockResolvedValue({
        id: "follow-123",
      });

      await expect(
        ensureNotAlreadyFollowing("viewer-123", "target-456")
      ).rejects.toThrow("You are already following this user");
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database error");
      (mockPrisma.follow.findFirst as jest.Mock).mockRejectedValue(dbError);

      await expect(
        ensureNotAlreadyFollowing("viewer-123", "target-456")
      ).rejects.toThrow(dbError);
    });
  });

  describe("ensureCurrentlyFollowing", () => {
    it("should return follow ID when currently following", async () => {
      const followRecord = { id: "follow-123" };
      (mockPrisma.follow.findFirst as jest.Mock).mockResolvedValue(
        followRecord
      );

      const result = await ensureCurrentlyFollowing("viewer-123", "target-456");

      expect(result).toBe("follow-123");
      expect(mockPrisma.follow.findFirst).toHaveBeenCalledWith({
        where: { followerId: "viewer-123", followingId: "target-456" },
        select: { id: true },
      });
    });

    it("should throw when not currently following", async () => {
      (mockPrisma.follow.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ensureCurrentlyFollowing("viewer-123", "target-456")
      ).rejects.toThrow("You are not following this user");
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database error");
      (mockPrisma.follow.findFirst as jest.Mock).mockRejectedValue(dbError);

      await expect(
        ensureCurrentlyFollowing("viewer-123", "target-456")
      ).rejects.toThrow(dbError);
    });
  });

  describe("isFollowNotificationBlocked", () => {
    const mockTx = {
      block: {
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaTransaction>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return false when notification is not blocked", async () => {
      (mockTx.block.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await isFollowNotificationBlocked(
        mockTx,
        "follower-123",
        "target-456"
      );

      expect(result).toBe(false);
      expect(mockTx.block.findFirst).toHaveBeenCalledWith({
        where: { blockerId: "target-456", blockedId: "follower-123" },
        select: { id: true },
      });
    });

    it("should return true when notification is blocked", async () => {
      (mockTx.block.findFirst as jest.Mock).mockResolvedValue({
        id: "block-123",
      });

      const result = await isFollowNotificationBlocked(
        mockTx,
        "follower-123",
        "target-456"
      );

      expect(result).toBe(true);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database error");
      (mockTx.block.findFirst as jest.Mock).mockRejectedValue(dbError);

      await expect(
        isFollowNotificationBlocked(mockTx, "follower-123", "target-456")
      ).rejects.toThrow(dbError);
    });

    it("should use the provided transaction client", async () => {
      (mockTx.block.findFirst as jest.Mock).mockResolvedValue(null);

      await isFollowNotificationBlocked(mockTx, "follower-123", "target-456");

      // Verify that the transaction client is used, not the global prisma
      expect(mockPrisma.block.findFirst).not.toHaveBeenCalled();
      expect(mockTx.block.findFirst).toHaveBeenCalled();
    });
  });
});

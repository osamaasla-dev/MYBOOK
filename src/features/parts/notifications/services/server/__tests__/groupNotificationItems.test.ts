import { NotificationType } from "@prisma/client";

import type {
  NotificationGroupingSummary,
  NotificationListItem,
} from "../../../types";
import { groupNotificationItems } from "../groupNotificationItems";

const buildNotification = (
  overrides: Partial<NotificationListItem> = {}
): NotificationListItem => ({
  id: overrides.id ?? `notif-${Math.random().toString(36).slice(2)}`,
  type: overrides.type ?? NotificationType.REACTION,
  metadata: overrides.metadata ?? null,
  isRead: overrides.isRead ?? false,
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  actor:
    overrides.actor ??
    (overrides.actor === null
      ? null
      : {
          id: "actor-1",
          username: "actor1",
          avatarUrl: null,
          name: "Actor One",
        }),
  related: {
    followId: overrides.related?.followId ?? null,
    postId: overrides.related?.postId ?? "post-1",
    commentId: overrides.related?.commentId ?? null,
  },
  grouping: overrides.grouping ?? null,
});

describe("groupNotificationItems", () => {
  it("returns items unchanged when no groupable notifications exist", () => {
    const items = [
      buildNotification({
        type: NotificationType.FOLLOW,
        related: { followId: "follow-1", postId: null, commentId: null },
      }),
      buildNotification({
        type: NotificationType.MENTION,
        related: { followId: null, postId: null, commentId: null },
      }),
    ];

    const result = groupNotificationItems(items);

    expect(result).toEqual(items);
  });

  it("groups reactions on the same comment with multiple actors", () => {
    const commentId = "comment-123";
    const items = [
      buildNotification({
        id: "reaction-1",
        type: NotificationType.REACTION,
        actor: { id: "user-A", username: "A", avatarUrl: null, name: "User A" },
        related: { followId: null, postId: null, commentId },
      }),
      buildNotification({
        id: "reaction-2",
        type: NotificationType.REACTION,
        actor: { id: "user-B", username: "B", avatarUrl: null, name: "User B" },
        related: { followId: null, postId: null, commentId },
      }),
      buildNotification({
        id: "reaction-3",
        type: NotificationType.REACTION,
        actor: { id: "user-C", username: "C", avatarUrl: null, name: "User C" },
        related: { followId: null, postId: null, commentId },
      }),
    ];

    const result = groupNotificationItems(items);

    const target = result[0];
    const expectedGrouping: NotificationGroupingSummary = {
      totalActors: 3,
      othersCount: 2,
    };
    expect(target.grouping).toEqual(expectedGrouping);
    expect(target.id).toBe("reaction-1");
    expect(result).toHaveLength(1);
  });

  it("groups comments/shares on the same post when postId exists", () => {
    const postId = "post-789";
    const commentNotification = buildNotification({
      id: "comment-1",
      type: NotificationType.COMMENT,
      actor: {
        id: "user-1",
        username: "user1",
        avatarUrl: null,
        name: "User1",
      },
      related: { followId: null, postId, commentId: null },
    });
    const shareNotification = buildNotification({
      id: "share-1",
      type: NotificationType.SHARE,
      actor: {
        id: "user-2",
        username: "user2",
        avatarUrl: null,
        name: "User2",
      },
      related: { followId: null, postId, commentId: null },
    });

    const result = groupNotificationItems([
      commentNotification,
      shareNotification,
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].grouping).toBeNull();
    expect(result[1].grouping).toBeNull();

    const commentResult = result[0];
    const shareResult = result[1];

    expect(commentResult.related.postId).toBe(postId);
    expect(shareResult.related.postId).toBe(postId);
  });

  it("treats missing postId as non-groupable even for groupable types", () => {
    const items = [
      buildNotification({
        id: "comment-no-post",
        type: NotificationType.COMMENT,
        related: { followId: null, postId: null, commentId: null },
      }),
      buildNotification({
        id: "share-no-post",
        type: NotificationType.SHARE,
        related: { followId: null, postId: null, commentId: null },
      }),
    ];

    const result = groupNotificationItems(items);

    expect(result).toEqual(items);
  });

  it("maintains order and grouping state across mixed notifications", () => {
    const items = [
      buildNotification({
        id: "comment-1",
        type: NotificationType.COMMENT,
        actor: { id: "user-A", username: "A", avatarUrl: null, name: "User A" },
        related: { followId: null, postId: "post-1", commentId: null },
      }),
      buildNotification({
        id: "comment-2",
        type: NotificationType.COMMENT,
        actor: { id: "user-B", username: "B", avatarUrl: null, name: "User B" },
        related: { followId: null, postId: "post-1", commentId: null },
      }),
      buildNotification({
        id: "share-1",
        type: NotificationType.SHARE,
        actor: { id: "user-C", username: "C", avatarUrl: null, name: "User C" },
        related: { followId: null, postId: "post-2", commentId: null },
      }),
      buildNotification({
        id: "reaction-single",
        type: NotificationType.REACTION,
        actor: { id: "user-D", username: "D", avatarUrl: null, name: "User D" },
        related: { followId: null, postId: "post-3", commentId: null },
      }),
      buildNotification({
        id: "reaction-double",
        type: NotificationType.REACTION,
        actor: { id: "user-E", username: "E", avatarUrl: null, name: "User E" },
        related: { followId: null, postId: "post-3", commentId: null },
      }),
    ];

    const result = groupNotificationItems(items);

    expect(result).toHaveLength(items.length - 2);

    const firstGrouped = result[0];
    expect(firstGrouped.grouping).toEqual({
      totalActors: 2,
      othersCount: 1,
    });

    const reactionGrouped = result[result.length - 1];
    expect(reactionGrouped.id).toBe("reaction-single");
    expect(reactionGrouped.grouping).toEqual({
      totalActors: 2,
      othersCount: 1,
    });
  });

  it("ignores actor grouping when actor information is missing", () => {
    const items = [
      buildNotification({
        id: "reaction-with-actor",
        type: NotificationType.REACTION,
        actor: { id: "user-A", username: "A", avatarUrl: null, name: "User A" },
        related: { followId: null, postId: "post-10", commentId: null },
      }),
      buildNotification({
        id: "reaction-without-actor",
        type: NotificationType.REACTION,
        actor: null,
        related: { followId: null, postId: "post-10", commentId: null },
      }),
    ];

    const result = groupNotificationItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].grouping).toBeUndefined();
  });
});

// Test component to verify L-shaped connector functionality
"use client";

import { CommentListItem } from "./src/features/parts/postDetails/components/PostDetailsModal/CommentListItem";

// Mock data for testing
const mockComment = {
  id: "1",
  content: "This is a parent comment",
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  isEdited: false,
  replyCount: 1,
  reactionsCount: 0,
  authorId: "user1",
  author: {
    name: "Test User",
    username: "testuser",
    avatarUrl: null,
  },
  viewerReaction: null,
  reactionSummary: null,
  parentId: null,
};

const mockReply = {
  id: "2",
  content: "This is a reply",
  createdAt: "2023-01-01T01:00:00Z",
  updatedAt: "2023-01-01T01:00:00Z",
  isEdited: false,
  replyCount: 0,
  reactionsCount: 0,
  authorId: "user2",
  author: {
    name: "Reply User",
    username: "replyuser",
    avatarUrl: null,
  },
  viewerReaction: null,
  reactionSummary: null,
  parentId: "1",
};

export function TestCommentConnector() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Testing L-shaped Comment Connector</h2>

      {/* Parent comment */}
      <CommentListItem
        comment={mockComment}
        viewerId="user1"
        postAuthorId="user1"
        postId="post1"
        isReply={false}
      />

      {/* Reply comment - this should show the L-shaped connector */}
      <CommentListItem
        comment={mockReply}
        viewerId="user1"
        postAuthorId="user1"
        postId="post1"
        isReply={true}
      />
    </div>
  );
}

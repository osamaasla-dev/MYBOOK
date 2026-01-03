import type { RelationTab } from "../types";

export const TAB_LABELS: Record<RelationTab, string> = {
  followers: "Followers",
  following: "Following",
  "follow-requests": "Follow Requests",
  "sent-follow-requests": "Sent Requests",
  friends: "Friends",
  "friend-requests": "Friend Requests",
  "sent-friend-requests": "Sent Friend Requests",
  blocked: "Blocked Users",
};

export const RELATION_SECTIONS: Array<{
  title: string;
  tabs: RelationTab[];
}> = [
  {
    title: "Follow network",
    tabs: ["followers", "following", "follow-requests", "sent-follow-requests"],
  },
  {
    title: "Friends",
    tabs: ["friends", "friend-requests", "sent-friend-requests"],
  },
  {
    title: "Privacy & safety",
    tabs: ["blocked"],
  },
];

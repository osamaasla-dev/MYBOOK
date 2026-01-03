export type RelationTab =
  | "followers"
  | "following"
  | "follow-requests"
  | "sent-follow-requests"
  | "friends"
  | "friend-requests"
  | "sent-friend-requests"
  | "blocked";

export type RelationsSidebarNavProps = {
  value: RelationTab;
  onChange: (tab: RelationTab) => void;
  disabled?: boolean;
  testId?: string;
};

import type { ReactionTab } from "../../services/server/reactions";

export type ReactionOptionCount = {
  id: ReactionTab;
  label: string;
  emoji: string;
  count: number;
};

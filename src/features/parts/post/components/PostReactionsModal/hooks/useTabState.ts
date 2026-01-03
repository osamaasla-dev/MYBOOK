import { useEffect, useState } from "react";
import type { ReactionOptionCount } from "../types";
import { ReactionTab } from "../../../services/server/reactions";

type UseTabStateProps = {
  initialTab?: ReactionTab;
  reactionTabs: ReactionOptionCount[];
  open: boolean;
};

export function useTabState({
  initialTab = "all",
  reactionTabs,
  open,
}: UseTabStateProps) {
  const [currentTab, setCurrentTab] = useState<ReactionTab>(initialTab);

  // Reset tab when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);

  // Ensure current tab exists in available tabs
  useEffect(() => {
    if (currentTab === "all") return;
    if (!reactionTabs.some((tab) => tab.id === currentTab)) {
      setCurrentTab(reactionTabs[0]?.id ?? "all");
    }
  }, [currentTab, reactionTabs]);

  return {
    currentTab,
    setCurrentTab,
  };
}

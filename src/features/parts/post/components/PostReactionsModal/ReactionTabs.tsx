"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui";

import type { ReactionTab } from "../../services/server/reactions";
import type { ReactionOptionCount } from "./types";
import { usePrefetchPostReactions } from "../../hooks/usePrefetchPostReactions";

type ReactionTabsProps = {
  postId: string;
  currentTab: ReactionTab;
  onTabChange: (value: ReactionTab) => void;
  reactionTabs: ReactionOptionCount[];
  resolvedAllCount: number;
};

export function ReactionTabs({
  postId,
  currentTab,
  onTabChange,
  reactionTabs,
  resolvedAllCount,
}: ReactionTabsProps) {
  const prefetchReactions = usePrefetchPostReactions({
    postId,
  });

  const handleChange = (value: string) => {
    onTabChange(value as ReactionTab);
  };

  const handlePrefetch = (value: ReactionTab) => () => {
    prefetchReactions({ tab: value });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleChange}>
      <TabsList className="flex w-full flex-wrap gap-1 bg-transparent p-0">
        <TabsTrigger
          value="all"
          className="cursor-pointer flex-auto rounded-full border px-4 py-1.5 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-primary/10 hover:border-primary hover:bg-primary/10"
          onMouseEnter={handlePrefetch("all")}
          onFocus={handlePrefetch("all")}
        >
          <span className="flex items-center">
            All
            <span className="rounded-full bg-muted px-2 py-0.5 text-md font-medium ">
              {resolvedAllCount}
            </span>
          </span>
        </TabsTrigger>
        {reactionTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="cursor-pointer flex-auto rounded-full border px-4 py-1.5 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-primary/10 hover:border-primary hover:bg-primary/10"
            onMouseEnter={handlePrefetch(tab.id)}
            onFocus={handlePrefetch(tab.id)}
          >
            <span className="flex items-center">
              <span aria-hidden="true">{tab.emoji}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-md font-medium ">
                {tab.count}
              </span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

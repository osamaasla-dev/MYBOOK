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
  testId?: string;
};

export function ReactionTabs({
  postId,
  currentTab,
  onTabChange,
  reactionTabs,
  resolvedAllCount,
  testId,
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
    <Tabs
      value={currentTab}
      onValueChange={handleChange}
      data-testid={testId || "reaction-tabs"}
      role="tablist"
      aria-label="Reaction type filters"
    >
      <TabsList
        className="flex w-full flex-wrap gap-1 bg-transparent p-0"
        role="tablist"
        aria-label="Filter reactions by type"
      >
        <TabsTrigger
          value="all"
          className="cursor-pointer flex-auto rounded-full border px-4 py-1.5 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-primary/10 hover:border-primary hover:bg-primary/10"
          onMouseEnter={handlePrefetch("all")}
          onFocus={handlePrefetch("all")}
          role="tab"
          aria-selected={currentTab === "all"}
          aria-controls={testId ? `${testId}-panel-all` : "reaction-panel-all"}
          data-testid={testId ? `${testId}-tab-all` : "reaction-tab-all"}
        >
          <span className="flex items-center">
            <span
              className="mr-2"
              aria-hidden="true"
              data-testid={
                testId ? `${testId}-tab-all-label` : "reaction-tab-all-label"
              }
            >
              All
            </span>
            <span
              className="rounded-full bg-muted px-2 py-0.5 text-md font-medium"
              aria-label={`All reactions count: ${resolvedAllCount}`}
              data-testid={
                testId ? `${testId}-tab-all-count` : "reaction-tab-all-count"
              }
            >
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
            role="tab"
            aria-selected={currentTab === tab.id}
            aria-controls={
              testId ? `${testId}-panel-${tab.id}` : `reaction-panel-${tab.id}`
            }
            data-testid={
              testId ? `${testId}-tab-${tab.id}` : `reaction-tab-${tab.id}`
            }
          >
            <span className="flex items-center">
              <span
                className="mr-2"
                aria-hidden="true"
                data-testid={
                  testId
                    ? `${testId}-tab-${tab.id}-emoji`
                    : `reaction-tab-${tab.id}-emoji`
                }
              >
                {tab.emoji}
              </span>
              <span
                className="rounded-full bg-muted px-2 py-0.5 text-md font-medium"
                aria-label={`${tab.emoji} reactions count: ${tab.count}`}
                data-testid={
                  testId
                    ? `${testId}-tab-${tab.id}-count`
                    : `reaction-tab-${tab.id}-count`
                }
              >
                {tab.count}
              </span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

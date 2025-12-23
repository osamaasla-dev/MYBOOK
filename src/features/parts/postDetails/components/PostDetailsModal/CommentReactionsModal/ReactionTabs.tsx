"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui";

import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";
import type { ReactionOptionCount } from "./types";
import { usePrefetchCommentReactions } from "@/features/parts/postDetails/hooks/usePrefetchCommentReactions";

type ReactionTabsProps = {
  postId: string;
  commentId: string;
  currentTab: CommentReactionTab;
  onTabChange: (value: CommentReactionTab) => void;
  reactionTabs: ReactionOptionCount[];
  resolvedAllCount: number;
};

export function CommentReactionTabs({
  postId,
  commentId,
  currentTab,
  onTabChange,
  reactionTabs,
  resolvedAllCount,
}: ReactionTabsProps) {
  const prefetchReactions = usePrefetchCommentReactions({
    postId,
    commentId,
  });

  const handleChange = (value: string) => {
    onTabChange(value as CommentReactionTab);
  };

  const handlePrefetch = (value: CommentReactionTab) => () => {
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
          <span className="flex items-center gap-2">
            All
            <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium">
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
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{tab.emoji}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium">
                {tab.count}
              </span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

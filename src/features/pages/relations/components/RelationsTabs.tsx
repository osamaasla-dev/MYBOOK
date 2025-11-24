"use client";

import { useMemo } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RELATION_TABS, type RelationTab } from "../types";

const TAB_LABELS: Record<RelationTab, string> = {
  followers: "Followers",
  following: "Following",
  "follow-requests": "Follow Requests",
  friends: "Friends",
  "friend-requests": "Friend Requests",
};

type RelationsTabsProps = {
  value: RelationTab;
  onChange: (tab: RelationTab) => void;
  disabled?: boolean;
};

export function RelationsTabs({
  value,
  onChange,
  disabled,
}: RelationsTabsProps) {
  const tabs = useMemo(
    () => RELATION_TABS.map((tab) => [tab, TAB_LABELS[tab]] as const),
    []
  );

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as RelationTab)}
      className="w-full"
    >
      <TabsList className="w-full overflow-x-auto">
        {tabs.map(([tab, label]) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="flex-1 capitalize"
            disabled={disabled}
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

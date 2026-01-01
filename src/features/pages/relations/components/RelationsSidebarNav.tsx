"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import type { RelationTab } from "../types";

const TAB_LABELS: Record<RelationTab, string> = {
  followers: "Followers",
  following: "Following",
  "follow-requests": "Follow Requests",
  "sent-follow-requests": "Sent Requests",
  friends: "Friends",
  "friend-requests": "Friend Requests",
  "sent-friend-requests": "Sent Friend Requests",
  blocked: "Blocked Users",
};

const RELATION_SECTIONS: Array<{
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

type RelationsSidebarNavProps = {
  value: RelationTab;
  onChange: (tab: RelationTab) => void;
  disabled?: boolean;
};

export function RelationsSidebarNav({
  value,
  onChange,
  disabled,
}: RelationsSidebarNavProps) {
  const sections = useMemo(() => RELATION_SECTIONS, []);

  return (
    <aside className="rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="space-y-6 px-3 py-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.tabs.map((tab) => {
                const isActive = tab === value;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-secondary text-primary"
                        : "cursor-pointer text-muted-foreground hover:bg-secondary hover:text-primary",
                      disabled && !isActive && "cursor-not-allowed opacity-70"
                    )}
                    onClick={() => onChange(tab)}
                    disabled={disabled}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="capitalize">{TAB_LABELS[tab]}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

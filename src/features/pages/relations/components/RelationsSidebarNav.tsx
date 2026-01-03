"use client";

import {
  useRelationTabs,
  RelationsNavSection,
} from "./RelationsSidebarNav/index";
import type { RelationsSidebarNavProps } from "./RelationsSidebarNav/index";

export function RelationsSidebarNav({
  value,
  onChange,
  disabled,
  testId = "relations-sidebar-nav",
}: RelationsSidebarNavProps) {
  const sections = useRelationTabs();

  return (
    <aside
      className="rounded-2xl border border-border/70 bg-card shadow-sm"
      role="navigation"
      aria-label="Relations navigation"
      data-testid={testId}
    >
      <div className="space-y-6 px-3 py-4">
        {sections.map((section) => (
          <RelationsNavSection
            key={section.title}
            title={section.title}
            tabs={section.tabs}
            activeTab={value}
            onTabChange={onChange}
            disabled={disabled}
            testId={`${testId}-section-${section.title
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          />
        ))}
      </div>
    </aside>
  );
}

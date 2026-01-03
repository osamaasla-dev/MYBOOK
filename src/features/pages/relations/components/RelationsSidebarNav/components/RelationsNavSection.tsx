import { RelationTab } from "../types";
import { RelationsNavButton } from "./RelationsNavButton";

type RelationsNavSectionProps = {
  title: string;
  tabs: RelationTab[];
  activeTab: RelationTab;
  onTabChange: (tab: RelationTab) => void;
  disabled?: boolean;
  testId?: string;
};

export function RelationsNavSection({
  title,
  tabs,
  activeTab,
  onTabChange,
  disabled,
  testId,
}: RelationsNavSectionProps) {
  return (
    <section className="space-y-2" data-testid={`${testId}-section`}>
      <h3
        className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80"
        data-testid={`${testId}-section-title`}
        id={`${testId}-section-title`}
      >
        {title}
      </h3>

      <div
        className="space-y-1"
        role="list"
        aria-labelledby={`${testId}-section-title`}
        data-testid={`${testId}-section-list`}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <RelationsNavButton
              key={tab}
              tab={tab}
              isActive={isActive}
              disabled={disabled}
              testId={`${testId}-tab-${tab}`}
              onClick={() => onTabChange(tab)}
              aria-describedby={
                isActive ? `${testId}-section-title` : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";
import { TAB_LABELS } from "../constants/tabs";
import type { RelationTab } from "../types";

type RelationsNavButtonProps = {
  tab: RelationTab;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  "aria-describedby"?: string;
};

export function RelationsNavButton({
  tab,
  isActive,
  disabled,
  onClick,
  testId,
  "aria-describedby": ariaDescribedby,
}: RelationsNavButtonProps) {
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
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${TAB_LABELS[tab]} ${isActive ? "(current)" : ""} tab`}
      aria-describedby={ariaDescribedby}
      data-testid={testId}
      role="tab"
    >
      <span className="capitalize" data-testid={`${testId}-label`}>
        {TAB_LABELS[tab]}
      </span>
      {isActive && (
        <span
          className="h-2 w-2 rounded-full bg-primary"
          aria-hidden="true"
          data-testid={`${testId}-indicator`}
        />
      )}
    </button>
  );
}

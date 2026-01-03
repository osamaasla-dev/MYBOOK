"use client";

import type { ComponentType, SVGProps } from "react";

export type ComposerActionItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  iconClassName: string;
  badgeClassName: string;
  inputAccept: string;
  inputId: string;
  mediaType?: "image" | "video";
};

type ActionsRowProps = {
  actionItems: ComposerActionItem[];
  onFileSelect?: (file: File, action: ComposerActionItem) => void;
  testId?: string;
};

export function ActionsRow({
  actionItems,
  onFileSelect,
  testId,
}: ActionsRowProps) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-dashed border-border p-2"
      role="group"
      aria-label="Media upload options"
      data-testid={testId || "actions-row"}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        Add to your post
      </div>
      <div
        className="flex items-center gap-3 text-muted-foreground"
        role="group"
        aria-label="Media upload actions"
      >
        {actionItems.map((action, index) => {
          const {
            icon: Icon,
            label,
            iconClassName,
            badgeClassName,
            inputAccept,
            inputId,
            mediaType,
          } = action;

          return (
            <label
              key={`composer-action-${label}`}
              htmlFor={inputId}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-90 ${badgeClassName}`}
              aria-label={`Upload ${mediaType || "file"}: ${label}`}
              data-testid={
                testId
                  ? `${testId}-action-${index}`
                  : `actions-row-action-${index}`
              }
            >
              <input
                type="file"
                id={inputId}
                accept={inputAccept}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  onFileSelect?.(file, action);
                  event.target.value = "";
                }}
                aria-describedby={
                  testId
                    ? `${testId}-action-${index}-description`
                    : `actions-row-action-${index}-description`
                }
              />
              <div className="flex items-center gap-2">
                <Icon
                  className={`size-6 ${iconClassName}`}
                  aria-hidden="true"
                  data-testid={
                    testId
                      ? `${testId}-action-${index}-icon`
                      : `actions-row-action-${index}-icon`
                  }
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  id={
                    testId
                      ? `${testId}-action-${index}-description`
                      : `actions-row-action-${index}-description`
                  }
                  data-testid={
                    testId
                      ? `${testId}-action-${index}-label`
                      : `actions-row-action-${index}-label`
                  }
                >
                  {label}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

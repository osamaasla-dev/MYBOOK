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
};

export function ActionsRow({ actionItems, onFileSelect }: ActionsRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        Add to your post
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        {actionItems.map((action) => {
          const {
            icon: Icon,
            label,
            iconClassName,
            badgeClassName,
            inputAccept,
            inputId,
          } = action;

          return (
            <label
              key={`composer-action-${label}`}
              htmlFor={inputId}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-90 ${badgeClassName}`}
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
              />
              <div className="flex items-center gap-2">
                <Icon
                  className={`size-6 ${iconClassName}`}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold uppercase tracking-wide">
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

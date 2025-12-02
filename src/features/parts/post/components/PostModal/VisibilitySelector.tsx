"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { PostVisibility, PostVisibilityPreference } from "@prisma/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { VISIBILITY_OPTIONS } from "./visibilityOptions";

type VisibilitySelectorProps = {
  visibility: PostVisibility;
  visibilityPreference: PostVisibilityPreference;
  onChange: (selection: {
    visibility: PostVisibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
};

export function VisibilitySelector({
  visibility,
  visibilityPreference,
  onChange,
}: VisibilitySelectorProps) {
  const selectedVisibility = useMemo(() => {
    if (visibilityPreference === PostVisibilityPreference.ACCOUNT_DEFAULT) {
      return VISIBILITY_OPTIONS[0];
    }

    return (
      VISIBILITY_OPTIONS.find((option) => {
        return (
          option.selection.visibility === visibility &&
          option.selection.visibilityPreference === visibilityPreference
        );
      }) ?? VISIBILITY_OPTIONS[1]
    );
  }, [visibility, visibilityPreference]);

  const handleVisibilityChange = (value: string) => {
    const option = VISIBILITY_OPTIONS.find((item) => item.value === value);
    if (option) {
      onChange(option.selection);
    }
  };

  const SelectedIcon = selectedVisibility.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary cursor-pointer"
        >
          <SelectedIcon className="size-3.5" aria-hidden="true" />
          {selectedVisibility.label}
          <ChevronDown className="size-3" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 bg-white">
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
          Choose who can see this post
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={selectedVisibility.value}
          onValueChange={handleVisibilityChange}
        >
          {VISIBILITY_OPTIONS.map(
            ({ value, label, description, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="flex flex-col items-start gap-1 py-2 cursor-pointer focus:bg-secondary data-[state=checked]:bg-primary-light"
              >
                <span className="flex w-full items-center gap-2 text-base font-medium">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </DropdownMenuRadioItem>
            )
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

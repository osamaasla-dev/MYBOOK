"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Visibility, PostVisibilityPreference } from "@prisma/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { VISIBILITY_OPTIONS } from "./utils/visibilityOptions";

type VisibilitySelectorProps = {
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  onChange: (selection: {
    visibility: Visibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
  testId?: string;
};

export function VisibilitySelector({
  visibility,
  visibilityPreference,
  onChange,
  testId,
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
          aria-label={`Post visibility: ${selectedVisibility.label}. Click to change visibility options.`}
          aria-expanded="false"
          aria-haspopup="menu"
          data-testid={
            testId ? `${testId}-trigger` : "visibility-selector-trigger"
          }
        >
          <SelectedIcon className="size-3.5" aria-hidden="true" />
          <span
            data-testid={
              testId ? `${testId}-selected-label` : "visibility-selected-label"
            }
          >
            {selectedVisibility.label}
          </span>
          <ChevronDown className="size-3" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 bg-white"
        data-testid={
          testId ? `${testId}-content` : "visibility-selector-content"
        }
        role="menu"
        aria-label="Post visibility options"
      >
        <DropdownMenuLabel
          className="text-[11px] font-semibold text-muted-foreground"
          id={testId ? `${testId}-label` : "visibility-selector-label"}
        >
          Choose who can see this post
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={selectedVisibility.value}
          onValueChange={handleVisibilityChange}
          aria-labelledby={
            testId ? `${testId}-label` : "visibility-selector-label"
          }
          role="radiogroup"
          data-testid={
            testId ? `${testId}-radiogroup` : "visibility-radiogroup"
          }
        >
          {VISIBILITY_OPTIONS.map(
            ({ value, label, description, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="flex flex-col items-start gap-1 py-2 cursor-pointer focus:bg-secondary data-[state=checked]:bg-primary-light"
                role="menuitemradio"
                aria-checked={selectedVisibility.value === value}
                aria-describedby={
                  testId
                    ? `${testId}-option-${value}-desc`
                    : `visibility-option-${value}-desc`
                }
                data-testid={
                  testId
                    ? `${testId}-option-${value}`
                    : `visibility-option-${value}`
                }
              >
                <span className="flex w-full items-center gap-2 text-base font-medium">
                  <Icon className="size-4" aria-hidden="true" />
                  <span
                    data-testid={
                      testId
                        ? `${testId}-option-${value}-label`
                        : `visibility-option-${value}-label`
                    }
                  >
                    {label}
                  </span>
                </span>
                <span
                  className="text-sm text-muted-foreground"
                  id={
                    testId
                      ? `${testId}-option-${value}-desc`
                      : `visibility-option-${value}-desc`
                  }
                  data-testid={
                    testId
                      ? `${testId}-option-${value}-description`
                      : `visibility-option-${value}-description`
                  }
                >
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

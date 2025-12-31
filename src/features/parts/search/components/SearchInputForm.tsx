"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputFormProps = {
  value: string;
  placeholder: string;
  autoFocus?: boolean;
  dropdownId: string;
  shouldShowDropdown: boolean;
  activeOptionId?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SearchInputForm({
  value,
  placeholder,
  autoFocus,
  dropdownId,
  shouldShowDropdown,
  activeOptionId,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onSubmit,
}: SearchInputFormProps) {
  return (
    <form
      className="relative"
      role="search"
      aria-label="Search about users ..."
      onSubmit={onSubmit}
    >
      <span className="sr-only" id="user-search-label">
        Search about users ...
      </span>

      <Input
        type="search"
        placeholder={placeholder}
        aria-labelledby="user-search-label"
        aria-expanded={shouldShowDropdown}
        aria-controls={shouldShowDropdown ? dropdownId : undefined}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full rounded-full border-transparent bg-white pl-10 text-base text-black shadow-sm placeholder:text-black/60",
          "focus-visible:ring-2 focus-visible:ring-primary"
        )}
      />

      <button
        type="submit"
        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        aria-label="Search"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

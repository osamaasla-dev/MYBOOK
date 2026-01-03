"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { UserSearchSuggestion } from "../../services/client/userSearchApi";
import { useUserSearchSuggestions } from "../useUserSearchSuggestions";
import { useUserSearchInput } from "./useUserSearchInput";

type UseUserSearchBoxControllerOptions = {
  debounceMs?: number;
  minLength?: number;
  onSubmit?: (query: string) => void;
  onSuggestionSelect?: (suggestion: UserSearchSuggestion) => void;
};

export function useUserSearchBoxController({
  debounceMs = 220,
  minLength = 2,
  onSubmit,
  onSuggestionSelect,
}: UseUserSearchBoxControllerOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { inputValue, setInputValue, query, isReady } = useUserSearchInput({
    debounceMs,
    minLength,
  });

  const suggestionQuery = useUserSearchSuggestions({
    query,
    enabled: isReady,
  });

  const suggestions = useMemo(
    () => suggestionQuery.data?.hits ?? [],
    [suggestionQuery.data?.hits]
  );

  const trimmedValue = inputValue.trim();

  const shouldShowDropdown =
    isOpen &&
    (suggestionQuery.isFetching ||
      suggestionQuery.isError ||
      suggestions.length > 0 ||
      (!suggestionQuery.isFetching && isReady));

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextQuery = trimmedValue;
      if (!nextQuery) return;
      onSubmit?.(nextQuery);

      // Remove focus from input after submission
      const inputEl =
        containerRef.current?.querySelector<HTMLInputElement>("input");
      inputEl?.blur();
      setIsFocused(false);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSubmit, trimmedValue]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: UserSearchSuggestion) => {
      setInputValue(suggestion.name || "");
      onSuggestionSelect?.(suggestion);

      const inputEl =
        containerRef.current?.querySelector<HTMLInputElement>("input");
      inputEl?.blur();
      setIsFocused(false);

      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSuggestionSelect, setInputValue]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
      if (!isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen, setInputValue]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (
        !shouldShowDropdown ||
        (!suggestionQuery.isFetching && suggestions.length === 0)
      ) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) =>
          suggestions.length === 0 ? -1 : (prev + 1) % suggestions.length
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) =>
          suggestions.length === 0
            ? -1
            : prev <= 0
            ? suggestions.length - 1
            : prev - 1
        );
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        const suggestion = suggestions[activeIndex];
        if (suggestion) {
          handleSuggestionSelect(suggestion);
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [
      activeIndex,
      handleSuggestionSelect,
      shouldShowDropdown,
      suggestionQuery.isFetching,
      suggestions,
    ]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (isFocused && trimmedValue) {
      setIsOpen(true);
    } else if (!trimmedValue) {
      setIsOpen(false);
    }
  }, [isFocused, trimmedValue]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return {
    containerRef,
    inputValue,
    shouldShowDropdown,
    activeIndex,
    suggestions,
    isReady,
    isFetching: suggestionQuery.isFetching,
    isError: Boolean(suggestionQuery.isError),
    handleInputChange,
    handleFocus,
    handleBlur,
    handleKeyDown,
    handleSubmit,
    handleSuggestionSelect,
    handleSuggestionHover: setActiveIndex,
  } as const;
}

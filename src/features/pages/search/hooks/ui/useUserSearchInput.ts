"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";

export type UseUserSearchInputOptions = {
  debounceMs?: number;
  minLength?: number;
};

export function useUserSearchInput({
  debounceMs = 200,
  minLength = 1,
}: UseUserSearchInputOptions = {}) {
  const [inputValue, setInputValue] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");

  const trimmedValue = inputValue.trim();

  const debouncedCommit = useMemo(
    () =>
      debounce((next: string) => {
        setCommittedQuery(next);
      }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    debouncedCommit(trimmedValue);
    return () => {
      debouncedCommit.cancel();
    };
  }, [trimmedValue, debouncedCommit]);

  const canTriggerQuery = committedQuery.length >= minLength;

  const commitValue = useCallback((next: string) => {
    setInputValue(next);
  }, []);

  const activeQuery = useMemo(() => {
    if (!canTriggerQuery) {
      return "";
    }
    return committedQuery;
  }, [canTriggerQuery, committedQuery]);

  return {
    inputValue,
    setInputValue: commitValue,
    query: activeQuery,
    isReady: canTriggerQuery,
  } as const;
}

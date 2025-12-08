"use client";

import { Visibility, PostVisibilityPreference } from "@prisma/client";
import { produce } from "immer";
import debounce from "lodash/debounce";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

const COMPOSER_STORAGE_KEY = "post-store";
const STORAGE_DEBOUNCE_MS = 500;

const DEFAULT_VISIBILITY = Visibility.PUBLIC;
const DEFAULT_VISIBILITY_PREFERENCE = PostVisibilityPreference.ACCOUNT_DEFAULT;

type PostComposerState = {
  contentValue: string;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  setContentValue: (value: string) => void;
  setVisibility: (visibility: Visibility) => void;
  setVisibilityPreference: (preference: PostVisibilityPreference) => void;
  reset: () => void;
};

const createDebouncedStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const baseStorage = createJSONStorage<PostComposerState>(
    () => window.localStorage
  ) as PersistStorage<PostComposerState>;

  const debouncedSetItem = debounce(
    (
      name: Parameters<typeof baseStorage.setItem>[0],
      value: Parameters<typeof baseStorage.setItem>[1]
    ) => {
      baseStorage.setItem(name, value);
    },
    STORAGE_DEBOUNCE_MS
  );

  const debouncedStorage: PersistStorage<PostComposerState> = {
    getItem: baseStorage.getItem,
    setItem: (name, value) => {
      debouncedSetItem(name, value);
    },
    removeItem: (name) => {
      debouncedSetItem.cancel();
      baseStorage.removeItem(name);
    },
  };

  return debouncedStorage;
};

const debouncedStorage = createDebouncedStorage();

export const usePostStore = create<PostComposerState>()(
  persist(
    (set) => ({
      contentValue: "",
      visibility: DEFAULT_VISIBILITY,
      visibilityPreference: DEFAULT_VISIBILITY_PREFERENCE,
      setContentValue: (value) =>
        set(
          produce((draft) => {
            draft.contentValue = value;
          })
        ),
      setVisibility: (visibility) =>
        set(
          produce((draft) => {
            draft.visibility = visibility;
          })
        ),
      setVisibilityPreference: (preference) =>
        set(
          produce((draft) => {
            draft.visibilityPreference = preference;
          })
        ),
      reset: () =>
        set(
          produce((draft) => {
            draft.contentValue = "";
            draft.visibility = DEFAULT_VISIBILITY;
            draft.visibilityPreference = DEFAULT_VISIBILITY_PREFERENCE;
          })
        ),
    }),
    {
      name: COMPOSER_STORAGE_KEY,
      ...(debouncedStorage ? { storage: debouncedStorage } : {}),
      version: 1,
    }
  )
);

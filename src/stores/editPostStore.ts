"use client";

import { PostCardMedia } from "@/features/parts/post/components/PostCard/types";
import { Visibility, PostVisibilityPreference } from "@prisma/client";
import { produce } from "immer";
import { create } from "zustand";

const DEFAULT_VISIBILITY = Visibility.PUBLIC;
const DEFAULT_VISIBILITY_PREFERENCE = PostVisibilityPreference.ACCOUNT_DEFAULT;

type EditPostState = {
  // Edit mode state
  editingPostId: string | null;
  initialContent: string;
  initialMedia: PostCardMedia[];
  initialVisibility: Visibility;
  initialVisibilityPreference: PostVisibilityPreference;

  // Current edit values
  contentValue: string;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;

  // Actions
  setContentValue: (value: string) => void;
  setVisibility: (visibility: Visibility) => void;
  setVisibilityPreference: (preference: PostVisibilityPreference) => void;
  setEditMode: (
    isEdit: boolean,
    postId?: string,
    content?: string,
    media?: PostCardMedia[],
    visibility?: Visibility,
    preference?: PostVisibilityPreference
  ) => void;
  reset: () => void;

  // Dirty state helpers
  isDirty: () => boolean;
  hasContentChanged: () => boolean;
  hasVisibilityChanged: () => boolean;
  hasMediaChanged: () => boolean;
};

export const useEditPostStore = create<EditPostState>((set, get) => ({
  // Edit mode state
  editingPostId: null,
  initialContent: "",
  initialMedia: [],
  initialVisibility: DEFAULT_VISIBILITY,
  initialVisibilityPreference: DEFAULT_VISIBILITY_PREFERENCE,

  // Current edit values
  contentValue: "",
  visibility: DEFAULT_VISIBILITY,
  visibilityPreference: DEFAULT_VISIBILITY_PREFERENCE,

  // Actions
  setContentValue: (value) =>
    set(
      produce((draft: EditPostState) => {
        draft.contentValue = value;
      })
    ),
  setVisibility: (visibility) =>
    set(
      produce((draft: EditPostState) => {
        draft.visibility = visibility;
      })
    ),
  setVisibilityPreference: (preference) =>
    set(
      produce((draft: EditPostState) => {
        draft.visibilityPreference = preference;
      })
    ),
  setEditMode: (isEdit, postId, content, media, visibility, preference) =>
    set(
      produce((draft: EditPostState) => {
        if (isEdit && postId) {
          draft.editingPostId = postId;
          draft.initialContent = content || "";
          draft.initialMedia = media || [];
          draft.initialVisibility = visibility || DEFAULT_VISIBILITY;
          draft.initialVisibilityPreference =
            preference || DEFAULT_VISIBILITY_PREFERENCE;
          // Set current values to initial values for editing
          draft.contentValue = content || "";
          draft.visibility = visibility || DEFAULT_VISIBILITY;
          draft.visibilityPreference =
            preference || DEFAULT_VISIBILITY_PREFERENCE;
        } else {
          draft.editingPostId = null;
          draft.initialContent = "";
          draft.initialMedia = [];
          draft.initialVisibility = DEFAULT_VISIBILITY;
          draft.initialVisibilityPreference = DEFAULT_VISIBILITY_PREFERENCE;
          draft.contentValue = "";
          draft.visibility = DEFAULT_VISIBILITY;
          draft.visibilityPreference = DEFAULT_VISIBILITY_PREFERENCE;
        }
      })
    ),
  reset: () =>
    set(
      produce((draft: EditPostState) => {
        draft.editingPostId = null;
        draft.initialContent = "";
        draft.initialMedia = [];
        draft.initialVisibility = DEFAULT_VISIBILITY;
        draft.initialVisibilityPreference = DEFAULT_VISIBILITY_PREFERENCE;
        draft.contentValue = "";
        draft.visibility = DEFAULT_VISIBILITY;
        draft.visibilityPreference = DEFAULT_VISIBILITY_PREFERENCE;
      })
    ),

  // Dirty state helpers
  isDirty: () => {
    const state = get();
    return (
      state.hasContentChanged() ||
      state.hasVisibilityChanged() ||
      state.hasMediaChanged()
    );
  },
  hasContentChanged: () => {
    const state = get();
    return state.contentValue !== state.initialContent;
  },
  hasVisibilityChanged: () => {
    const state = get();
    return (
      state.visibility !== state.initialVisibility ||
      state.visibilityPreference !== state.initialVisibilityPreference
    );
  },
  hasMediaChanged: () => {
    const state = get();
    // Compare media arrays by ID and basic properties
    if (state.initialMedia.length !== state.initialMedia.length) {
      return true;
    }

    return state.initialMedia.some((initialMedia, index) => {
      const currentMedia = state.initialMedia[index];
      return (
        !currentMedia ||
        initialMedia.id !== currentMedia.id ||
        initialMedia.url !== currentMedia.url ||
        initialMedia.type !== currentMedia.type
      );
    });
  },
}));

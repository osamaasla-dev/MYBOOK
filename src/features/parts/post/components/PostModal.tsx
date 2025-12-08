"use client";

import type { CurrentUser } from "@/features/types";

import {
  PostModalShell,
  PostActions,
  PostEditorPanel,
} from "./PostModal/index";

import { usePostState, usePostPublishing } from "./PostModal/hooks";
import { usePostStore } from "@/stores/postStore";

type PostModalProps = {
  open: boolean;
  onClose: () => void;
  user: CurrentUser | null | undefined;
  placeholder: string;
};

export function PostModal({
  open,
  onClose,
  user,
  placeholder,
}: PostModalProps) {
  const resetComposer = usePostStore((state) => state.reset);

  const {
    contentValue,
    setContentValue,
    statusMessage,
    setStatusMessage,
    editorRef,
    mediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
    actionItems,
    trimmedContent,
    canPublish,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
  } = usePostState({ isOpen: open });

  const handleResetDraft = () => {
    resetComposer();
    clearMedia();
    setStatusMessage(null);
  };

  const { isPublishing, publishPost, progress } = usePostPublishing({
    trimmedContent,
    mediaPreviews,
    clearMedia,
    setStatusMessage,
    onClose,
    visibility,
    visibilityPreference,
    resetDraft: handleResetDraft,
  });

  return (
    <PostModalShell open={open} onClose={onClose} title="Create Post">
      <PostEditorPanel
        user={user}
        placeholder={placeholder}
        statusMessage={statusMessage}
        setStatusMessage={setStatusMessage}
        editorRef={editorRef}
        contentValue={contentValue}
        setContentValue={setContentValue}
        mediaPreviews={mediaPreviews}
        appendMedia={appendMedia}
        removeMedia={removeMedia}
        actionItems={actionItems}
        visibility={visibility}
        visibilityPreference={visibilityPreference}
        setVisibility={setVisibility}
        setVisibilityPreference={setVisibilityPreference}
      />

      <PostActions
        canPublish={canPublish}
        isPublishing={isPublishing}
        progress={progress}
        onPublish={() => publishPost({ canPublish })}
        onResetDraft={handleResetDraft}
      />
    </PostModalShell>
  );
}

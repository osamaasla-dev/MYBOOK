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
  testId?: string;
};

export function CreatePostModalLayer({
  open,
  onClose,
  user,
  placeholder,
  testId,
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

  const { isPublishing, publishPost } = usePostPublishing({
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
    <PostModalShell
      open={open}
      onClose={onClose}
      title="Create Post"
      testId={testId || "create-post-modal"}
      ariaLabel="Create new post dialog"
    >
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
        testId={testId ? `${testId}-editor` : "create-post-editor"}
      />

      <PostActions
        canPublish={canPublish}
        isPublishing={isPublishing}
        onPublish={() => publishPost({ canPublish })}
        onResetDraft={handleResetDraft}
        testId={testId ? `${testId}-actions` : "create-post-actions"}
      />
    </PostModalShell>
  );
}

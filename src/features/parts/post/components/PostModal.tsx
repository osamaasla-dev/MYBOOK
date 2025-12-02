"use client";

import type { PostVisibility, PostVisibilityPreference } from "@prisma/client";

import type { CurrentUser } from "@/features/types";

import { ModalHeader, ModalShell, PostPanel } from "./PostModal/index";
import { usePostComposerState, usePostPublishing } from "./PostModal/hooks";

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
  } = usePostComposerState({ isOpen: open });

  const { isPublishing, publishPost } = usePostPublishing({
    trimmedContent,
    mediaPreviews,
    clearMedia,
    setStatusMessage,
    setContentValue,
    onClose,
    visibility,
    visibilityPreference,
  });

  const handleEditorChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (statusMessage) {
      setStatusMessage(null);
    }
    setContentValue(event.target.value);
  };

  const handleMediaSelect = (file: File) => {
    if (statusMessage) {
      setStatusMessage(null);
    }
    appendMedia({ file });
  };

  const handleVisibilityChange = ({
    visibility: nextVisibility,
    visibilityPreference: nextPreference,
  }: {
    visibility: PostVisibility;
    visibilityPreference: PostVisibilityPreference;
  }) => {
    setVisibility(nextVisibility);
    setVisibilityPreference(nextPreference);
  };

  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} ariaLabel="Create post editor">
      <ModalHeader title="Create Post" onClose={onClose} />

      <PostPanel
        user={user}
        placeholder={placeholder}
        editorRef={editorRef}
        contentValue={contentValue}
        onContentChange={handleEditorChange}
        mediaPreviews={mediaPreviews}
        onRemoveMedia={removeMedia}
        actionItems={actionItems}
        onFileSelect={handleMediaSelect}
        visibility={visibility}
        visibilityPreference={visibilityPreference}
        onVisibilityChange={handleVisibilityChange}
      />

      {statusMessage && (
        <div className="text-danger px-4 text-sm" aria-live="assertive">
          {statusMessage}
        </div>
      )}

      <div className="p-4 pt-2">
        <button
          type="button"
          onClick={() => publishPost({ canPublish })}
          className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPublishing || !canPublish}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </ModalShell>
  );
}

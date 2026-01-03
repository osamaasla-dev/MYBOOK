"use client";

import { useCurrentUser } from "@/features/hooks";
import { PostModalShell } from "./PostModal/index";
import { useEditPostState } from "./EditPostModalLayer/hooks/useEditPostState";
import { useEditPostActions } from "./EditPostModalLayer/hooks/useEditPostActions";
import { EditPostContent } from "./EditPostModalLayer/components/EditPostContent";

export type EditPostModalLayerProps = {
  testId?: string;
};

export function EditPostModalLayer({ testId }: EditPostModalLayerProps) {
  const { data: user } = useCurrentUser();

  // Edit post state management
  const {
    contentValue,
    setContentValue,
    statusMessage,
    setStatusMessage,
    editorRef,

    canPublish,
    mediaPreviews,
    setMediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
    actionItems,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
    isEditModalOpen,
    editingPostId,
    closeEditModal,
  } = useEditPostState();

  // Edit post actions
  const { isPublishing, handleUpdate, handleResetDraft } = useEditPostActions({
    editingPostId,
    contentValue,
    mediaPreviews,
    visibility,
    visibilityPreference,
    setMediaPreviews,
    setContentValue,
    setStatusMessage,
    closeEditModal,
    clearMedia,
  });

  return (
    <PostModalShell
      open={isEditModalOpen}
      onClose={closeEditModal}
      title="Edit Post"
      testId={testId || "edit-post-modal"}
      ariaLabel="Edit post dialog"
    >
      <EditPostContent
        user={user}
        placeholder={`What's on your mind, ${user?.name}?`}
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
        canPublish={canPublish}
        isPublishing={isPublishing}
        onUpdate={handleUpdate}
        onResetDraft={handleResetDraft}
        testId={testId || "edit-post-modal"}
      />
    </PostModalShell>
  );
}

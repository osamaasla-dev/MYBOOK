import type { CurrentUser } from "@/features/types";
import type { RefObject } from "react";
import type { Visibility, PostVisibilityPreference } from "@prisma/client";
import { PostEditorPanel, PostActions } from "../../PostModal/index";
import type { ComposerActionItem } from "../../PostModal/ActionsRow";
import type { MediaPreview } from "../../PostModal/hooks/useMediaPreview";

type EditPostContentProps = {
  user: CurrentUser | null | undefined;
  placeholder: string;
  statusMessage: string | null;
  setStatusMessage: (message: string | null) => void;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  contentValue: string;
  setContentValue: (value: string) => void;
  mediaPreviews: MediaPreview[];
  appendMedia: (params: {
    file: File;
    mediaType?: MediaPreview["type"];
  }) => void;
  removeMedia: (id: string) => void;
  actionItems: ComposerActionItem[];
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  setVisibility: (visibility: Visibility) => void;
  setVisibilityPreference: (preference: PostVisibilityPreference) => void;
  canPublish: boolean;
  isPublishing: boolean;
  onUpdate: () => void;
  onResetDraft: () => void;
  testId?: string;
};

export function EditPostContent({
  user,
  placeholder,
  statusMessage,
  setStatusMessage,
  editorRef,
  contentValue,
  setContentValue,
  mediaPreviews,
  appendMedia,
  removeMedia,
  actionItems,
  visibility,
  visibilityPreference,
  setVisibility,
  setVisibilityPreference,
  canPublish,
  isPublishing,
  onUpdate,
  onResetDraft,
  testId,
}: EditPostContentProps) {
  return (
    <>
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
        testId={testId ? `${testId}-editor` : "edit-post-editor"}
      />

      <PostActions
        canPublish={canPublish}
        isPublishing={isPublishing}
        onPublish={onUpdate}
        onResetDraft={onResetDraft}
        testId={testId ? `${testId}-actions` : "edit-post-actions"}
      />
    </>
  );
}

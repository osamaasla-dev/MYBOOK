import type { RefObject } from "react";
import type { Visibility, PostVisibilityPreference } from "@prisma/client";

import type { CurrentUser } from "@/features/types";

import { PostPanel } from "./PostPanel";
import type { MediaPreview } from "./hooks";
import type { ComposerActionItem } from "./ActionsRow";

const MEDIA_ACTION_DEFAULTS = { mediaType: undefined } as const;

type PostEditorPanelProps = {
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
  testId?: string;
};

export function PostEditorPanel({
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
  testId,
}: PostEditorPanelProps) {
  const handleEditorChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (statusMessage) {
      setStatusMessage(null);
    }
    setContentValue(event.target.value);
  };

  const handleMediaSelect = (file: File, _action: ComposerActionItem) => {
    if (statusMessage) {
      setStatusMessage(null);
    }
    appendMedia({ file, ...MEDIA_ACTION_DEFAULTS });
  };

  const handleVisibilityChange = ({
    visibility: nextVisibility,
    visibilityPreference: nextPreference,
  }: {
    visibility: Visibility;
    visibilityPreference: PostVisibilityPreference;
  }) => {
    setVisibility(nextVisibility);
    setVisibilityPreference(nextPreference);
  };

  return (
    <>
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
        testId={testId || "post-editor-panel"}
      />

      {statusMessage && (
        <div
          className="text-danger px-4 text-sm"
          aria-live="assertive"
          role="alert"
          data-testid={
            testId ? `${testId}-status-message` : "post-editor-status-message"
          }
        >
          {statusMessage}
        </div>
      )}
    </>
  );
}

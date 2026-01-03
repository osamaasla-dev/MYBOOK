import { useMemo } from "react";

import type { Visibility, PostVisibilityPreference } from "@prisma/client";

import type { CurrentUser } from "@/features/types";

import {
  ActionsRow,
  ProfileRow,
  ComposerActionItem,
  EditorTextarea,
  MediaPreviewList,
} from "./index";

import type { MediaPreview } from "./hooks";

type PostPanelProps = {
  user: CurrentUser | null | undefined;
  placeholder: string;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  contentValue: string;
  onContentChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  mediaPreviews: MediaPreview[];
  onRemoveMedia: (id: string) => void;
  actionItems: ComposerActionItem[];
  onFileSelect: (file: File, action: ComposerActionItem) => void;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  onVisibilityChange: (selection: {
    visibility: Visibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
  testId?: string;
};

export function PostPanel({
  user,
  placeholder,
  editorRef,
  contentValue,
  onContentChange,
  mediaPreviews,
  onRemoveMedia,
  actionItems,
  onFileSelect,
  visibility,
  visibilityPreference,
  onVisibilityChange,
  testId,
}: PostPanelProps) {
  const displayName = useMemo(
    () => user?.name || user?.username || "User",
    [user?.name, user?.username]
  );
  const initials = useMemo(() => {
    return (
      user?.name?.charAt(0).toUpperCase() ||
      user?.username?.charAt(0).toUpperCase() ||
      "?"
    );
  }, [user?.name, user?.username]);

  return (
    <div
      className="p-4"
      data-testid={testId || "post-panel"}
      role="region"
      aria-label="Post creation form"
    >
      <div className="flex flex-col gap-2">
        <ProfileRow
          user={user}
          displayName={displayName}
          initials={initials}
          visibility={visibility}
          visibilityPreference={visibilityPreference}
          onVisibilityChange={onVisibilityChange}
          testId={testId ? `${testId}-profile` : "post-panel-profile"}
        />

        <div className="mt-10 mb-3 min-h-[110px] max-h-[250px] max-w-full overflow-y-auto">
          <div className="flex flex-col gap-3">
            <EditorTextarea
              ref={editorRef}
              value={contentValue}
              onChange={onContentChange}
              placeholder={placeholder}
              data-testid={testId ? `${testId}-editor` : "post-panel-editor"}
              aria-required="true"
              aria-describedby={
                testId ? `${testId}-editor-help` : "post-panel-editor-help"
              }
            />

            <MediaPreviewList
              previews={mediaPreviews}
              onRemove={onRemoveMedia}
              testId={testId ? `${testId}-media` : "post-panel-media"}
            />
          </div>
        </div>

        <ActionsRow
          actionItems={actionItems}
          onFileSelect={onFileSelect}
          testId={testId ? `${testId}-actions` : "post-panel-actions"}
        />
      </div>
    </div>
  );
}

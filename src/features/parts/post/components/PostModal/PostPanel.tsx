import { useMemo } from "react";

import type { PostVisibility, PostVisibilityPreference } from "@prisma/client";

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
  visibility: PostVisibility;
  visibilityPreference: PostVisibilityPreference;
  onVisibilityChange: (selection: {
    visibility: PostVisibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
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
    <div className="p-4">
      <div className="flex flex-col gap-2">
        <ProfileRow
          user={user}
          displayName={displayName}
          initials={initials}
          visibility={visibility}
          visibilityPreference={visibilityPreference}
          onVisibilityChange={onVisibilityChange}
        />

        <div className="mt-10 mb-3 min-h-[110px] max-h-[250px] max-w-full overflow-y-auto">
          <div className="flex flex-col gap-3">
            <EditorTextarea
              ref={editorRef}
              value={contentValue}
              onChange={onContentChange}
              placeholder={placeholder}
            />

            <MediaPreviewList
              previews={mediaPreviews}
              onRemove={onRemoveMedia}
            />
          </div>
        </div>

        <ActionsRow actionItems={actionItems} onFileSelect={onFileSelect} />
      </div>
    </div>
  );
}

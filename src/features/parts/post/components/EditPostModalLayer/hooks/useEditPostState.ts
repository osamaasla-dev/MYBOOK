import { useEffect, useState } from "react";
import { useEditPostStore } from "@/stores/editPostStore";
import {
  useMediaPreview,
  type MediaPreview,
} from "../../PostModal/hooks/useMediaPreview";
import { useAutosizeTextarea } from "../../PostModal/hooks";
import { ImageIcon } from "lucide-react";
import type { ComposerActionItem } from "../../PostModal/ActionsRow";

export function useEditPostState() {
  const {
    contentValue,
    setContentValue,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
    editingPostId,
    initialMedia,
    reset,
  } = useEditPostStore();

  const isEditModalOpen = Boolean(editingPostId);

  // Media functionality
  const {
    mediaPreviews,
    setMediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
  } = useMediaPreview({
    isOpen: isEditModalOpen,
  });

  // Initialize media when modal opens
  useEffect(() => {
    if (!isEditModalOpen) {
      setMediaPreviews([]);
      return;
    }

    // Only set initial media if mediaPreviews is empty (first time opening)
    if (mediaPreviews.length === 0) {
      const convertedInitialMedia: MediaPreview[] = initialMedia.map(
        (media) => {
          const type: MediaPreview["type"] =
            media.type === "VIDEO" ? "video" : "image";

          return {
            id: `existing-${media.id}`,
            originId: media.id,
            publicId: media.publicId ?? null,
            url: media.url,
            type,
            name: type === "video" ? "Video" : "Image",
            file: new File([], media.id),
          };
        }
      );

      setMediaPreviews(convertedInitialMedia);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditModalOpen, editingPostId, initialMedia, setMediaPreviews]);

  // Status and other UI state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Action items for media upload
  const actionItems: ComposerActionItem[] = [
    {
      icon: ImageIcon,
      label: "Image / Video",
      iconClassName: "text-blue-500",
      badgeClassName: "bg-blue-50 text-blue-600 border border-blue-100",
      inputAccept: "image/*,video/*",
      inputId: "edit-composer-media-input",
    },
  ];

  const editorRef = useAutosizeTextarea(contentValue, isEditModalOpen);

  const trimmedContent = contentValue.trim();
  const canPublish = trimmedContent.length > 0 || mediaPreviews.length > 0;

  const closeEditModal = reset;

  return {
    // Content state
    contentValue,
    setContentValue,
    statusMessage,
    setStatusMessage,
    editorRef,
    trimmedContent,
    canPublish,

    // Media state
    mediaPreviews,
    setMediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
    actionItems,

    // Visibility state
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,

    // Modal control
    isEditModalOpen,
    editingPostId,
    closeEditModal,
  };
}

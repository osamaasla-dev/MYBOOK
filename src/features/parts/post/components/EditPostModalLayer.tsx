"use client";

import { useEffect, useState } from "react";

import {
  PostModalShell,
  PostActions,
  PostEditorPanel,
} from "./PostModal/index";

import { useUpdatePost } from "../hooks/useUpdatePost";
import { useEditPostStore } from "@/stores/editPostStore";
import { useCurrentUser } from "@/features/hooks";
import {
  useMediaPreview,
  type MediaPreview,
} from "./PostModal/hooks/useMediaPreview";
import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import { uploadAllMedia } from "./PostModal/hooks/publishing";
import { ImageIcon } from "lucide-react";
import type { ComposerActionItem } from "./PostModal/ActionsRow";
import { useAutosizeTextarea } from "./PostModal/hooks";

export function EditPostModalLayer() {
  const { data: user } = useCurrentUser();

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
  const closeEditModal = reset;
  const updateMutation = useUpdatePost();
  const mediaUploadMutation = useMediaUpload();

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

  const isPublishing =
    mediaUploadMutation.isPending || updateMutation.isPending;

  // Status and other UI state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  const handleUpdate = async () => {
    if (!editingPostId) return;

    setStatusMessage(null);

    try {
      // Separate existing media from new media
      const existingMedia = mediaPreviews.filter((preview) =>
        preview.id.startsWith("existing-")
      );
      const newMedia = mediaPreviews.filter(
        (preview) => !preview.id.startsWith("existing-")
      );

      // Upload only new media
      const uploadedMedia =
        newMedia.length > 0
          ? await uploadAllMedia({
              mediaPreviews: newMedia,
              mutateAsync: mediaUploadMutation.mutateAsync,
            })
          : [];

      // Convert existing media back to the expected format
      const existingMediaForUpdate = existingMedia.map((media) => ({
        url: media.url,
        publicId: media.id.replace("existing-", ""),
        type: media.type as "image" | "video",
      }));

      // Combine existing media with newly uploaded media
      const allMedia = [...existingMediaForUpdate, ...uploadedMedia];

      updateMutation.mutate(
        {
          postId: editingPostId,
          input: {
            content: contentValue,
            media: allMedia,
            visibility,
            visibilityPreference,
          },
        },
        {
          onSuccess: () => {
            console.log(allMedia);
            setMediaPreviews([]);
            setContentValue("");
            closeEditModal();
            setStatusMessage(null);
          },
        }
      );
    } catch {
      const message =
        mediaUploadMutation.error?.message ??
        updateMutation.error?.message ??
        "Failed to update post";
      setStatusMessage(message);
    }
  };

  const handleResetDraft = () => {
    setMediaPreviews([]);
    clearMedia();
    setContentValue("");
    setStatusMessage(null);
    closeEditModal();
  };

  return (
    <PostModalShell
      open={isEditModalOpen}
      onClose={closeEditModal}
      title="Edit Post"
    >
      <PostEditorPanel
        user={user}
        placeholder={`What's on your mind,${user?.name}?`}
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
        onPublish={handleUpdate}
        onResetDraft={handleResetDraft}
      />
    </PostModalShell>
  );
}

import { useCallback } from "react";
import { useUpdatePost } from "../../../hooks/useUpdatePost";
import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import { uploadAllMedia } from "../../PostModal/hooks/publishing";
import type { MediaPreview } from "../../PostModal/hooks/useMediaPreview";
import type { Visibility, PostVisibilityPreference } from "@prisma/client";

type UseEditPostActionsProps = {
  editingPostId: string | null;
  contentValue: string;
  mediaPreviews: MediaPreview[];
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  setMediaPreviews: (media: MediaPreview[]) => void;
  setContentValue: (value: string) => void;
  setStatusMessage: (message: string | null) => void;
  closeEditModal: () => void;
  clearMedia: () => void;
};

export function useEditPostActions({
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
}: UseEditPostActionsProps) {
  const updateMutation = useUpdatePost();
  const mediaUploadMutation = useMediaUpload();

  const isPublishing =
    mediaUploadMutation.isPending || updateMutation.isPending;

  const handleUpdate = useCallback(async () => {
    if (!editingPostId) return;

    setStatusMessage(null);

    try {
      // Separate existing media from new media
      const existingMedia = mediaPreviews.filter((preview) => preview.originId);
      const newMedia = mediaPreviews.filter((preview) => !preview.originId);

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
        id: media.originId!,
        url: media.url,
        publicId: media.publicId ?? null,
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
  }, [
    editingPostId,
    contentValue,
    mediaPreviews,
    visibility,
    visibilityPreference,
    setMediaPreviews,
    setContentValue,
    closeEditModal,
    setStatusMessage,
    mediaUploadMutation,
    updateMutation,
  ]);

  const handleResetDraft = useCallback(() => {
    setMediaPreviews([]);
    clearMedia();
    setContentValue("");
    setStatusMessage(null);
    closeEditModal();
  }, [
    setMediaPreviews,
    clearMedia,
    setContentValue,
    setStatusMessage,
    closeEditModal,
  ]);

  return {
    isPublishing,
    handleUpdate,
    handleResetDraft,
  };
}

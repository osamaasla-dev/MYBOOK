import {
  type PublishArgs,
  type UsePostPublishingOptions,
  buildPostPayload,
  uploadAllMedia,
  validateCanPublish,
  usePublishingMutations,
} from "./publishing";
import { postMessages } from "@/lib/messages";

export function usePostPublishing({
  trimmedContent,
  mediaPreviews,
  setStatusMessage,
  onClose,
  visibility,
  visibilityPreference,
  resetDraft,
}: UsePostPublishingOptions) {
  const { mediaUploadMutation, createPostMutation, isPublishing } =
    usePublishingMutations();

  const publishPost = async ({ canPublish }: PublishArgs) => {
    if (isPublishing) return;

    const validationMessage = validateCanPublish(canPublish);
    if (validationMessage) {
      setStatusMessage(validationMessage);
      return;
    }

    setStatusMessage(null);

    try {
      const uploadedMedia = await uploadAllMedia({
        mediaPreviews,
        mutateAsync: mediaUploadMutation.mutateAsync,
      });

      const input = buildPostPayload({
        content: trimmedContent,
        media: uploadedMedia,
        visibility,
        visibilityPreference,
      });

      await createPostMutation.mutateAsync({
        input,
      });

      resetDraft();
      onClose();
    } catch {
      const message =
        createPostMutation.error?.message ??
        mediaUploadMutation.error?.message ??
        postMessages.PUBLISHING_MESSAGES.genericFailure;
      setStatusMessage(message);
    }
  };

  return { isPublishing, publishPost };
}

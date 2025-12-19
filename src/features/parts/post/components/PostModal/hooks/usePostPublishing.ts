import { runTextModeration } from "@/features/parts/moderation/utils";
import {
  type PublishArgs,
  type UsePostPublishingOptions,
  buildPostPayload,
  uploadAllMedia,
  validateCanPublish,
  usePublishingProgress,
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
  const {
    moderationMutation,
    mediaUploadMutation,
    createPostMutation,
    isPublishing,
  } = usePublishingMutations();
  const { progress, updateProgress, resetProgress } = usePublishingProgress();
  const publishPost = async ({ canPublish }: PublishArgs) => {
    if (isPublishing) return;

    const validationMessage = validateCanPublish(canPublish);
    if (validationMessage) {
      setStatusMessage(validationMessage);
      resetProgress();
      return;
    }

    updateProgress(10, "Preparing post");
    setStatusMessage(null);

    try {
      if (trimmedContent.length > 0) {
        updateProgress(25, "Running text checks");
        const decision = await runTextModeration({
          content: trimmedContent,
          mutateAsync: moderationMutation.mutateAsync,
        });
        if (decision.status === "reject") {
          resetProgress();
          setStatusMessage(postMessages.PUBLISHING_MESSAGES.textRejected);
          return;
        }
      }

      const hasMedia = mediaPreviews.length > 0;
      updateProgress(
        hasMedia ? 45 : 55,
        hasMedia ? "Uploading media" : "Preparing post body"
      );
      const uploadedMedia = await uploadAllMedia({
        mediaPreviews,
        mutateAsync: mediaUploadMutation.mutateAsync,
      });

      updateProgress(75, "Submitting post");
      const input = buildPostPayload({
        content: trimmedContent,
        media: uploadedMedia,
        visibility,
        visibilityPreference,
      });

      await createPostMutation.mutateAsync({
        input,
      });

      updateProgress(100, "Post published");
      resetDraft();
      onClose();
      setTimeout(() => {
        resetProgress();
      }, 400);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : postMessages.PUBLISHING_MESSAGES.genericFailure;
      setStatusMessage(message);
      resetProgress();
    }
  };

  return { isPublishing, publishPost, progress };
}

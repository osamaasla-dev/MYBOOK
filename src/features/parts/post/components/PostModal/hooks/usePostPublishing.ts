import { useMutationState } from "@tanstack/react-query";
import { useModerationCheck } from "@/features/parts/moderation/hooks/useModerationCheck";
import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import {
  CREATE_POST_MUTATION_KEY,
  useCreatePost,
} from "@/features/parts/post/hooks/useCreatePost";

import {
  type PublishArgs,
  type UsePostPublishingOptions,
  buildPostPayload,
  runTextModeration,
  uploadAllMedia,
  validateCanPublish,
} from "./publishing";
import { postMessages } from "@/lib/messages";

export function usePostPublishing({
  trimmedContent,
  mediaPreviews,
  clearMedia,
  setStatusMessage,
  setContentValue,
  onClose,
  visibility,
  visibilityPreference,
}: UsePostPublishingOptions) {
  const moderationMutation = useModerationCheck();
  const mediaUploadMutation = useMediaUpload();
  const createPostMutation = useCreatePost();

  const createPostPendingStates = useMutationState({
    filters: {
      mutationKey: CREATE_POST_MUTATION_KEY,
      exact: true,
    },
    select: (mutation) => mutation.state.status === "pending",
  });

  const isPublishing =
    moderationMutation.isPending ||
    mediaUploadMutation.isPending ||
    createPostPendingStates.some(Boolean);
  const publishPost = async ({ canPublish }: PublishArgs) => {
    if (isPublishing) return;

    const validationMessage = validateCanPublish(canPublish);
    if (validationMessage) {
      setStatusMessage(validationMessage);
      return;
    }

    setStatusMessage(null);

    try {
      if (trimmedContent.length > 0) {
        const decision = await runTextModeration({
          content: trimmedContent,
          mutateAsync: moderationMutation.mutateAsync,
        });
        if (decision.status === "reject") {
          setStatusMessage(postMessages.PUBLISHING_MESSAGES.textRejected);
          return;
        }
      }

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

      setContentValue("");
      clearMedia();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : postMessages.PUBLISHING_MESSAGES.genericFailure;
      setStatusMessage(message);
    }
  };

  return { isPublishing, publishPost };
}

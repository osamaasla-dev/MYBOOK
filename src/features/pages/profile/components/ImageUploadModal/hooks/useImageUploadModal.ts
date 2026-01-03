"use client";

import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";

import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import { useMediaPreview } from "@/features/parts/post/components/PostModal/hooks/useMediaPreview";

export type UploadSuccessPayload = {
  url: string;
  publicId: string;
};

export type UseImageUploadModalOptions = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSuccess: (payload: UploadSuccessPayload) => Promise<void>;
};

export function useImageUploadModal({
  isOpen,
  title,
  onClose,
  onSuccess,
}: UseImageUploadModalOptions) {
  const mediaUploadMutation = useMediaUpload();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { mediaPreviews, appendMedia, removeMedia, clearMedia } =
    useMediaPreview({
      isOpen,
    });

  const context = title.toLowerCase().includes("avatar") ? "avatar" : "cover";

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      appendMedia({ file });
      setErrorMessage(null);
    },
    [appendMedia]
  );

  const handleConfirm = useCallback(async () => {
    if (mediaPreviews.length === 0) return;

    try {
      setErrorMessage(null);
      setIsUpdating(true);

      const uploadedMedia = await mediaUploadMutation.mutateAsync({
        file: mediaPreviews[0].file,
        context,
      });

      const asset = uploadedMedia.asset;
      if (asset?.url && asset?.publicId) {
        await onSuccess({ url: asset.url, publicId: asset.publicId });
        clearMedia();
        onClose();
        return;
      }

      throw new Error("الصورة المرفوعة تفتقد البيانات اللازمة");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(message);
    } finally {
      setIsUpdating(false);
    }
  }, [
    clearMedia,
    context,
    mediaPreviews,
    mediaUploadMutation,
    onClose,
    onSuccess,
  ]);

  const handleCancel = useCallback(() => {
    clearMedia();
    setErrorMessage(null);
    onClose();
  }, [clearMedia, onClose]);

  const isLoading = mediaUploadMutation.isPending;

  return {
    mediaPreviews,
    removeMedia,
    handleFileSelect,
    handleConfirm,
    handleCancel,
    errorMessage,
    isLoading,
    isUpdating,
  };
}

"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/features/parts/post/components/PostModal/ModalShell";
import { ModalHeader } from "@/features/parts/post/components/PostModal/ModalHeader";

import { useImageUploadModal } from "./ImageUploadModal/hooks/useImageUploadModal";
import type { UploadSuccessPayload } from "./ImageUploadModal/hooks/useImageUploadModal";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSuccess: (payload: UploadSuccessPayload) => Promise<void>;
  testId?: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  title,
  onSuccess,
  testId = "image-upload-modal",
}: ImageUploadModalProps) {
  const {
    mediaPreviews,
    removeMedia,
    handleFileSelect,
    handleConfirm,
    handleCancel,
    errorMessage,
    isLoading,
    isUpdating,
  } = useImageUploadModal({
    isOpen,
    title,
    onClose,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose} ariaLabel={`${title} modal`}>
      <ModalHeader title={title} onClose={onClose} />

      <div className="p-6 space-y-4" data-testid={testId}>
        {/* File Input - Only show if no image selected */}
        {mediaPreviews.length === 0 && (
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading || isUpdating}
                aria-label="Select image file"
              />
              <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors">
                <Upload
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">
                  Click to select image
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Preview */}
        {mediaPreviews.length > 0 && (
          <div className="relative" data-testid={`${testId}-preview`}>
            <img
              src={mediaPreviews[0].url}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              variant="none"
              className="opacity-50 hover:opacity-100 text-sm p-0 px-1 h-fit absolute top-2 right-2 bg-black text-white cursor-pointer"
              onClick={() => removeMedia(mediaPreviews[0].id)}
              disabled={isLoading}
              aria-label="Remove image"
              data-testid={`${testId}-remove-preview`}
            >
              remove
            </Button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            className="text-red-500 text-sm text-center bg-red-50 p-2 rounded"
            role="alert"
            aria-live="assertive"
            data-testid={`${testId}-error`}
          >
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            className="text-black border-2 border-secondary bg-white hover:bg-secondary/80 cursor-pointer"
            onClick={handleCancel}
            disabled={isLoading || isUpdating}
            data-testid={`${testId}-cancel`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mediaPreviews.length === 0 || isLoading || isUpdating}
            data-testid={`${testId}-confirm`}
          >
            {isLoading || isUpdating ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

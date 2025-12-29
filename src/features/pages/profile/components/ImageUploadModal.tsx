"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import { useMediaPreview } from "@/features/parts/post/components/PostModal/hooks/useMediaPreview";
import { ModalShell } from "@/features/parts/post/components/PostModal/ModalShell";
import { ModalHeader } from "@/features/parts/post/components/PostModal/ModalHeader";
import { useState } from "react";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSuccess: (url: string) => Promise<void>;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  title,
  onSuccess,
}: ImageUploadModalProps) {
  const mediaUploadMutation = useMediaUpload();

  // State for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create unique key for this modal instance to avoid conflicts

  const { mediaPreviews, appendMedia, removeMedia, clearMedia } =
    useMediaPreview({
      isOpen,
    });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      appendMedia({ file });
      // Clear error when selecting new file
      setErrorMessage(null);
    }
  };

  const handleConfirm = async () => {
    if (mediaPreviews.length === 0) return;

    try {
      // Clear previous error
      setErrorMessage(null);
      setIsUpdating(true);

      // Upload the first (and only) image
      const uploadedMedia = await mediaUploadMutation.mutateAsync({
        file: mediaPreviews[0].file,
        context: title.toLowerCase().includes("avatar") ? "avatar" : "cover",
      });

      // Get the uploaded URL and pass to onSuccess
      if (uploadedMedia.asset?.url) {
        await onSuccess(uploadedMedia.asset.url);

        clearMedia();
        onClose();
      }
    } catch (error: unknown) {
      const Message = error instanceof Error ? error.message : "Unknown error";
      console.error("Upload failed:", error);
      setErrorMessage(Message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    clearMedia();
    setErrorMessage(null);
    onClose();
  };

  const isLoading = mediaUploadMutation.isPending;

  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose} ariaLabel={`${title} modal`}>
      <ModalHeader title={title} onClose={onClose} />

      <div className="p-6 space-y-4">
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
              />
              <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors">
                <Upload className="size-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to select image
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Preview */}
        {mediaPreviews.length > 0 && (
          <div className="relative">
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
            >
              remove
            </Button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            className="text-black border-2 border-secondary bg-white hover:bg-secondary/80 cursor-pointer"
            onClick={handleCancel}
            disabled={isLoading || isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mediaPreviews.length === 0 || isLoading || isUpdating}
          >
            {isLoading || isUpdating ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

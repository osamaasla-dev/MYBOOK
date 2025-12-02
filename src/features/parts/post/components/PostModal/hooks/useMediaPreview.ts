import { useCallback, useEffect, useState } from "react";

export type MediaPreview = {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
  file: File;
};

type UseMediaPreviewOptions = {
  isOpen: boolean;
};

type AppendMediaParams = {
  file: File;
  mediaType?: MediaPreview["type"];
};

export function useMediaPreview({ isOpen }: UseMediaPreviewOptions) {
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);

  const appendMedia = useCallback(({ file, mediaType }: AppendMediaParams) => {
    const type: MediaPreview["type"] = mediaType
      ? mediaType
      : file.type.startsWith("video")
      ? "video"
      : "image";

    const previewUrl = URL.createObjectURL(file);

    setMediaPreviews((prev) => [
      ...prev,
      {
        id: `${type}-${Date.now()}-${Math.random()}`,
        url: previewUrl,
        type,
        name: file.name,
        file,
      },
    ]);
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMediaPreviews((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearMedia = useCallback(() => {
    setMediaPreviews((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
  }, []);

  useEffect(() => {
    if (!isOpen && mediaPreviews.length) {
      clearMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
  };
}

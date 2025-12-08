import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import type { ComposerActionItem } from "../ActionsRow";
import { useAutosizeTextarea } from "./useAutosizeTextarea";
import { useMediaPreview } from "./useMediaPreview";
import { usePostStore } from "@/stores/postStore";

type UsePostStateOptions = {
  isOpen: boolean;
};

export function usePostState({ isOpen }: UsePostStateOptions) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    contentValue,
    setContentValue,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
  } = usePostStore(
    useShallow((state) => ({
      contentValue: state.contentValue,
      setContentValue: state.setContentValue,
      visibility: state.visibility,
      setVisibility: state.setVisibility,
      visibilityPreference: state.visibilityPreference,
      setVisibilityPreference: state.setVisibilityPreference,
    }))
  );

  const editorRef = useAutosizeTextarea(contentValue, isOpen);
  const { mediaPreviews, appendMedia, removeMedia, clearMedia } =
    useMediaPreview({ isOpen });

  const actionItems = useMemo<ComposerActionItem[]>(
    () => [
      {
        icon: ImageIcon,
        label: "Image / Video",
        iconClassName: "text-blue-500",
        badgeClassName: "bg-blue-50 text-blue-600 border border-blue-100",
        inputAccept: "image/*,video/*",
        inputId: "composer-media-input",
      },
    ],
    []
  );

  const trimmedContent = contentValue.trim();
  const canPublish = trimmedContent.length > 0 || mediaPreviews.length > 0;

  return {
    contentValue,
    setContentValue,
    statusMessage,
    setStatusMessage,
    editorRef,
    mediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
    actionItems,
    trimmedContent,
    canPublish,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
  };
}

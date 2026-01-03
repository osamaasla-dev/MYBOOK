import { useEffect, useRef, useState } from "react";

import { type PostReactionType } from "../../constants/reactions";

type UseReactionPickerProps = {
  onReactionSelect: (reactionId: PostReactionType) => void;
  onReactionClear?: () => void;
};

export function useReactionPicker({
  onReactionSelect,
  onReactionClear,
}: UseReactionPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isPickerOpen]);

  const togglePicker = () => setIsPickerOpen((prev) => !prev);

  const handleSelect = (reactionId: PostReactionType) => {
    onReactionSelect(reactionId);
    setIsPickerOpen(false);
  };

  const handleClear = () => {
    onReactionClear?.();
    setIsPickerOpen(false);
  };

  const closePicker = () => setIsPickerOpen(false);

  return {
    isPickerOpen,
    reactionPickerRef,
    togglePicker,
    handleSelect,
    handleClear,
    closePicker,
  };
}

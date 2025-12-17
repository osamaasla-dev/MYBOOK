"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type CommentButtonProps = {
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
};

export function CommentButton({
  onClick,
  onHover,
  disabled = false,
}: CommentButtonProps) {
  const handleHover = disabled ? undefined : onHover;

  return (
    <Button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      className="flex flex-1 items-center justify-center rounded-md  bg-transparent px-2 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary disabled:opacity-60"
    >
      <MessageCircle className="mr-2 size-4" aria-hidden="true" />
      <span className="font-semibold">Comment</span>
    </Button>
  );
}

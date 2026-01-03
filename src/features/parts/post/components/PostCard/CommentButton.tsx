"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type CommentButtonProps = {
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
  testId?: string;
};

export function CommentButton({
  onClick,
  onHover,
  disabled = false,
  testId,
}: CommentButtonProps) {
  const handleHover = disabled ? undefined : onHover;

  return (
    <Button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      className="flex flex-1 items-center justify-center rounded-md  bg-transparent px-2 py-2 text-xs text-muted-foreground hover:bg-secondary "
      data-testid={testId}
      aria-label="Comment on post"
    >
      <MessageCircle
        className="mr-2 size-4"
        aria-hidden="true"
        data-testid={`${testId}-icon`}
      />
      <span className="font-semibold" data-testid={`${testId}-text`}>
        Comment
      </span>
    </Button>
  );
}

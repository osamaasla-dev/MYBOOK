"use client";

import { useMemo } from "react";

import { useCurrentUser } from "@/features/hooks";
import { AvatarBubble } from "@/features/parts/post/components/PostCard/AvatarBubble";
import { cn } from "@/lib/utils";

type PostCommentFormAvatarProps = {
  className?: string;
  imageClassName?: string;
};

export function PostCommentFormAvatar({
  className = "h-10 w-10 text-sm",
  imageClassName = "h-10 w-10",
}: PostCommentFormAvatarProps) {
  const { data: currentUser } = useCurrentUser();

  const avatarProps = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    const displayName = currentUser.name || currentUser.username || "You";
    return {
      name: displayName,
      avatarUrl: currentUser.avatarUrl ?? undefined,
    };
  }, [currentUser]);

  if (!avatarProps) {
    return (
      <span
        className={cn(
          "flex animate-pulse items-center justify-center rounded-full bg-muted",
          imageClassName
        )}
        data-testid="comment-avatar-loading"
      />
    );
  }

  return (
    <AvatarBubble
      {...avatarProps}
      className={className}
      imageClassName={imageClassName}
      data-testid="comment-avatar"
    />
  );
}

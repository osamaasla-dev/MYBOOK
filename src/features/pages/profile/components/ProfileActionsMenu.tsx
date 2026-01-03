"use client";

import { useState } from "react";
import { Camera, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProfileActionsMenuProps {
  triggerClassName?: string;
  onAvatarChange?: () => void;
  onCoverChange?: () => void;
  onAvatarRemove?: () => void;
  onCoverRemove?: () => void;
  hasAvatar?: boolean;
  hasCover?: boolean;
  testId?: string;
}

export function ProfileActionsMenu({
  triggerClassName,
  onAvatarChange,
  onCoverChange,
  onAvatarRemove,
  onCoverRemove,
  hasAvatar,
  hasCover,
  testId = "profile-actions-menu",
}: ProfileActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="none"
          className={cn(
            "size-8 p-0 text-muted-foreground transition duration-150 ease-out hover:text-foreground hover:bg-secondary",
            triggerClassName
          )}
          aria-label="Profile actions"
          data-testid={testId}
        >
          <Camera className="size-6" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px] border-none bg-white shadow-md"
        data-testid={`${testId}-content`}
      >
        <DropdownMenuItem
          className="cursor-pointer focus:bg-secondary"
          onSelect={(event) => {
            event.preventDefault();
            setIsMenuOpen(false);
            onAvatarChange?.();
          }}
          data-testid={`${testId}-change-avatar`}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="mr-2 size-4" aria-hidden="true" />
          Change Avatar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer focus:bg-secondary"
          onSelect={(event) => {
            event.preventDefault();
            setIsMenuOpen(false);
            onAvatarRemove?.();
          }}
          disabled={!hasAvatar}
          data-testid={`${testId}-remove-avatar`}
        >
          <X className="mr-2 size-4" aria-hidden="true" />
          Remove Avatar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer focus:bg-secondary"
          onSelect={(event) => {
            event.preventDefault();
            setIsMenuOpen(false);
            onCoverChange?.();
          }}
          data-testid={`${testId}-change-cover`}
        >
          <Camera className="mr-2 size-4" aria-hidden="true" />
          Change Cover
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer focus:bg-secondary"
          onSelect={(event) => {
            event.preventDefault();
            setIsMenuOpen(false);
            onCoverRemove?.();
          }}
          disabled={!hasCover}
          data-testid={`${testId}-remove-cover`}
        >
          <X className="mr-2 size-4" aria-hidden="true" />
          Remove Cover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

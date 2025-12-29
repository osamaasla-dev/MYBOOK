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
}

export function ProfileActionsMenu({
  triggerClassName,
  onAvatarChange,
  onCoverChange,
  onAvatarRemove,
  onCoverRemove,
  hasAvatar,
  hasCover,
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
        >
          <Camera className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px] border-none bg-white shadow-md"
      >
        <DropdownMenuItem
          className="cursor-pointer focus:bg-secondary"
          onSelect={(event) => {
            event.preventDefault();
            setIsMenuOpen(false);
            onAvatarChange?.();
          }}
        >
          <Image className="mr-2 size-4" />
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
        >
          <X className="mr-2 size-4" />
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
        >
          <Camera className="mr-2 size-4" />
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
        >
          <X className="mr-2 size-4" />
          Remove Cover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

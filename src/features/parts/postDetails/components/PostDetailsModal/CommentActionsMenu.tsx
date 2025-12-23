"use client";

import { useCallback, useState } from "react";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useDeletePostComment } from "../../hooks/useDeletePostComment";

type CommentActionsMenuProps = {
  commentId: string;
  parentId: string | null;
  postId: string;
  viewerId: string | null;
  commentAuthorId: string;
  postAuthorId: string | null;
  triggerClassName?: string;
  onEdit?: () => void;
};

export function CommentActionsMenu({
  commentId,
  parentId,
  postId,
  viewerId,
  commentAuthorId,
  postAuthorId,
  triggerClassName = "",
  onEdit,
}: CommentActionsMenuProps) {
  const isCommentOwner = viewerId === commentAuthorId;
  const canManage =
    Boolean(viewerId) && (isCommentOwner || viewerId === postAuthorId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteMutation = useDeletePostComment({
    postId,
    parentId,
  });

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({ commentId });
    } catch {
      // handled by hook toast
    }
  }, [commentId, deleteMutation]);

  const handleConfirmOpenChange = useCallback(
    (open: boolean) => {
      setIsConfirmOpen(open);
      if (open) {
        setIsMenuOpen(false);
      }
    },
    [setIsConfirmOpen]
  );

  if (!canManage) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="none"
            size="icon-sm"
            className={cn(
              "ml-auto size-7 p-0 text-muted-foreground opacity-0 transition duration-150 ease-out hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100",
              triggerClassName
            )}
            aria-label="Comment actions"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[140px] border-none bg-white shadow-md "
        >
          {isCommentOwner && (
            <DropdownMenuItem
              className="cursor-pointer focus:bg-secondary"
              data-variant="none"
              onSelect={(event) => {
                event.preventDefault();
                setIsMenuOpen(false);
                onEdit?.();
              }}
            >
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer focus:bg-secondary"
            data-variant="none"
            onSelect={(event) => {
              event.preventDefault();
              handleConfirmOpenChange(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        title="Delete this comment?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isConfirming={deleteMutation.isPending}
        open={isConfirmOpen}
        onOpenChange={handleConfirmOpenChange}
        onConfirm={handleDelete}
      />
    </>
  );
}

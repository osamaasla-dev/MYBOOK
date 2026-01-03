"use client";

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
import { useCommentActionsMenu } from "./useCommentActionsMenu";
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
  const {
    canManage,
    isCommentOwner,
    isMenuOpen,
    isConfirmOpen,
    isDeleting,
    handleMenuOpenChange,
    handleConfirmOpenChange,
    handleEditSelect,
    handleDeleteSelect,
    handleDelete,
  } = useCommentActionsMenu({
    commentId,
    parentId,
    postId,
    viewerId,
    commentAuthorId,
    postAuthorId,
    onEdit,
  });

  if (!canManage) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="none"
            size="icon-sm"
            className={cn(
              "ml-auto size-7 p-0 text-muted-foreground opacity-0 transition duration-150 ease-out hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100",
              triggerClassName
            )}
            aria-label="Comment actions menu"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            data-testid="comment-actions-trigger"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[140px] border-none bg-white shadow-md "
          aria-label="Comment actions"
          data-testid="comment-actions-menu"
        >
          {isCommentOwner && (
            <DropdownMenuItem
              className="cursor-pointer focus:bg-secondary"
              data-variant="none"
              data-testid="comment-actions-edit"
              onSelect={(event) => {
                event.preventDefault();
                handleEditSelect();
              }}
            >
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer focus:bg-secondary"
            data-variant="none"
            data-testid="comment-actions-delete"
            onSelect={(event) => {
              event.preventDefault();
              handleDeleteSelect();
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
        isConfirming={isDeleting}
        open={isConfirmOpen}
        onOpenChange={handleConfirmOpenChange}
        onConfirm={handleDelete}
        testId="comment-delete-dialog"
      />
    </>
  );
}

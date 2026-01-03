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
import { useDeletePost } from "../../hooks/useDeletePost";
import { useEditPostModal } from "../EditPostModalLayer/hooks/useEditPostModal";
import { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

type PostActionsMenuProps = {
  post: FeedPost;
  triggerClassName?: string;
  testId?: string;
};

export function PostActionsMenu({
  post,
  triggerClassName = "",
  testId,
}: PostActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteMutation = useDeletePost();
  const { openEditModal } = useEditPostModal();

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({ postId: post.postId });
    } catch {
      // handled by hook toast
    }
  }, [post.postId, deleteMutation]);

  const handleEdit = useCallback(() => {
    openEditModal(
      post.postId,
      post.content.text,
      post.content.media ?? [],
      post.visibility,
      post.visibilityPreference
    );
  }, [post, openEditModal]);

  const handleConfirmOpenChange = useCallback(
    (open: boolean) => {
      setIsConfirmOpen(open);
      if (open) {
        setIsMenuOpen(false);
      }
    },
    [setIsConfirmOpen]
  );

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="none"
            size="icon-sm"
            className={cn(
              "size-7 p-0 text-muted-foreground transition duration-150 ease-out hover:text-foreground hover:bg-secondary",
              triggerClassName
            )}
            aria-label="Post actions"
            data-testid={testId}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical className="size-4" data-testid={`${testId}-icon`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[140px] border-none bg-white shadow-md"
          data-testid={`${testId}-content`}
        >
          <DropdownMenuItem
            className="cursor-pointer focus:bg-secondary"
            data-variant="none"
            data-testid={`${testId}-edit`}
            onSelect={(event) => {
              event.preventDefault();
              setIsMenuOpen(false);
              handleEdit();
            }}
          >
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-secondary"
            data-variant="none"
            data-testid={`${testId}-delete`}
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
        title="Delete this post?"
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

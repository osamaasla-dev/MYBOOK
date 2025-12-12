"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommentButton() {
  return (
    <Button
      type="button"
      className="flex flex-1 items-center justify-center rounded-md  bg-transparent px-2 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary"
    >
      <MessageCircle className="mr-2 size-4" aria-hidden="true" />
      <span className="font-semibold">Comment</span>
    </Button>
  );
}

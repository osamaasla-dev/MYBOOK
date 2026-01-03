import { SendHorizonal, Trash2 } from "lucide-react";

export type PostCommentFormActionsProps = {
  isDisabled: boolean;
  charactersCount: number;
  onClear: () => void;
};

export function PostCommentFormActions({
  isDisabled,
  charactersCount,
  onClear,
}: PostCommentFormActionsProps) {
  const hasContent = charactersCount > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="group relative flex flex-col items-center">
        <button
          type="button"
          className="cursor-pointer text-danger transition hover:text-danger/80 disabled:cursor-not-allowed disabled:text-muted-foreground/50"
          disabled={isDisabled || !hasContent}
          aria-label="Clear comment"
          onClick={onClear}
          data-disabled={isDisabled || !hasContent}
          data-testid="clear-comment-button"
        >
          <Trash2 className="size-4" />
        </button>
        <span className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-md bg-black px-2 py-0.5 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-data-[disabled=true]:opacity-0">
          Clear
        </span>
      </div>

      <div className="group relative flex flex-col items-center">
        <button
          type="submit"
          className="cursor-pointer text-primary transition hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground/50"
          disabled={isDisabled || !hasContent}
          aria-label="Post comment"
          data-disabled={isDisabled || !hasContent}
          data-testid="submit-comment-button"
        >
          {isDisabled ? (
            <span className="text-sm font-semibold">…</span>
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </button>
        <span className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-md bg-black px-2 py-0.5 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-data-[disabled=true]:opacity-0">
          Send
        </span>
      </div>
    </div>
  );
}

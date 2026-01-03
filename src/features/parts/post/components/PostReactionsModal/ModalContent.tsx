import type { RefObject } from "react";
import { ReactionTabs } from "./ReactionTabs";
import { ReactionsList } from "./ReactionsList";
import type { ReactionOptionCount } from "./types";
import type {
  PostReactionListItem,
  ReactionTab,
} from "../../services/server/reactions";

type ModalContentProps = {
  postId: string;
  currentTab: ReactionTab;
  onTabChange: (value: string) => void;
  reactionTabs: ReactionOptionCount[];
  resolvedAllCount: number;
  items: PostReactionListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  testId?: string;
};

export function ModalContent({
  postId,
  currentTab,
  onTabChange,
  reactionTabs,
  resolvedAllCount,
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  sentinelRef,
  listRef,
  isFetchingNextPage,
  testId,
}: ModalContentProps) {
  return (
    <section
      className="flex flex-col gap-4 px-5 py-4"
      aria-labelledby={testId ? `${testId}-title` : "post-reactions-title"}
      data-testid={testId ? `${testId}-content` : "post-reactions-content"}
    >
      <ReactionTabs
        postId={postId}
        currentTab={currentTab}
        onTabChange={onTabChange}
        reactionTabs={reactionTabs}
        resolvedAllCount={resolvedAllCount}
        testId={testId ? `${testId}-tabs` : "post-reactions-tabs"}
      />

      <div
        ref={listRef}
        className="max-h-[65vh] overflow-y-auto pr-2"
        role="tabpanel"
        id={
          testId
            ? `${testId}-panel-${currentTab}`
            : `post-reactions-panel-${currentTab}`
        }
        aria-labelledby={
          testId ? `${testId}-tab-${currentTab}` : `reaction-tab-${currentTab}`
        }
        aria-label={`Reactions for ${
          currentTab === "all" ? "all types" : currentTab
        }`}
        data-testid={
          testId ? `${testId}-list-container` : "post-reactions-list-container"
        }
      >
        <ReactionsList
          items={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          sentinelRef={sentinelRef}
          isFetchingNextPage={isFetchingNextPage}
          testId={testId ? `${testId}-list` : "post-reactions-list"}
        />
      </div>
    </section>
  );
}

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { AvatarBubble } from "./AvatarBubble";
import { formatRelativeTime } from "./utils";
import { PostActionsMenu } from "./PostActionsMenu";
import Link from "next/link";

type PostCardHeaderProps = {
  author: FeedPost["author"];
  timestamp: string | Date;
  post?: FeedPost;
  testId?: string;
};

export function PostCardHeader({
  author,
  timestamp,
  post,
  testId,
}: PostCardHeaderProps) {
  const formattedTime = timestamp ? formatRelativeTime(timestamp) : null;
  const profileHref = author.username
    ? `/user/profile/${author.username}`
    : undefined;
  const showRelationshipBadges = author.isSelf !== true;
  const followLabel = author.isFollowing ? "Following" : "Not following";
  const friendLabel = author.isFriend ? "Friend" : "Not friend";

  const isSelf = author.isSelf;

  return (
    <header className="flex items-start gap-3 px-4" data-testid={testId}>
      {profileHref ? (
        <Link href={profileHref} data-testid={`${testId}-avatar-link`}>
          <AvatarBubble
            name={author.name}
            avatarUrl={author.avatarUrl}
            testId={`${testId}-avatar`}
          />
        </Link>
      ) : (
        <AvatarBubble
          name={author.name}
          avatarUrl={author.avatarUrl}
          testId={`${testId}-avatar`}
        />
      )}
      <div className="flex-1">
        <div
          className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary"
          data-testid={`${testId}-author-info`}
        >
          {profileHref ? (
            <Link
              href={profileHref}
              data-testid={`${testId}-author-link`}
              id={`${testId}-author`}
            >
              {author.name}
            </Link>
          ) : (
            <span data-testid={`${testId}-author-name`} id={`${testId}-author`}>
              {author.name}
            </span>
          )}

          {showRelationshipBadges && (
            <div
              className="flex flex-wrap items-center gap-2"
              data-testid={`${testId}-badges`}
            >
              <span
                className="rounded-full border border-border/70 px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                data-testid={`${testId}-following-badge`}
                aria-label={`Following status: ${followLabel}`}
              >
                {followLabel}
              </span>

              <span
                className="rounded-full border border-border/70 px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                data-testid={`${testId}-friend-badge`}
                aria-label={`Friend status: ${friendLabel}`}
              >
                {friendLabel}
              </span>
            </div>
          )}
        </div>
        {formattedTime && (
          <p
            className="text-xs text-muted-foreground"
            data-testid={`${testId}-timestamp`}
            aria-label={`Posted ${formattedTime}`}
          >
            {formattedTime}
          </p>
        )}
      </div>
      {isSelf && post && (
        <PostActionsMenu
          post={post}
          triggerClassName="ml-auto"
          testId={`${testId}-actions-menu`}
        />
      )}
    </header>
  );
}

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { AvatarBubble } from "./AvatarBubble";
import { formatRelativeTime } from "./utils";
import { PostActionsMenu } from "./PostActionsMenu";
import Link from "next/link";

type PostCardHeaderProps = {
  author: FeedPost["author"];
  timestamp: string | Date;
  post?: FeedPost;
};

export function PostCardHeader({
  author,
  timestamp,
  post,
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
    <header className="flex items-start gap-3 px-4">
      {profileHref ? (
        <Link href={profileHref}>
          <AvatarBubble name={author.name} avatarUrl={author.avatarUrl} />
        </Link>
      ) : (
        <AvatarBubble name={author.name} avatarUrl={author.avatarUrl} />
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
          {profileHref ? (
            <Link href={profileHref}>{author.name}</Link>
          ) : (
            <span>{author.name}</span>
          )}

          {showRelationshipBadges && (
            <>
              <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {followLabel}
              </span>

              <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {friendLabel}
              </span>
            </>
          )}
        </div>
        {formattedTime && (
          <p className="text-xs text-muted-foreground">{formattedTime}</p>
        )}
      </div>
      {isSelf && post && (
        <PostActionsMenu post={post} triggerClassName="ml-auto" />
      )}
    </header>
  );
}

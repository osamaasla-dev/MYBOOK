import { FollowRequestActions } from "@/features/parts/follow/components/FollowRequestActions";
import { AcceptRejectFriendButtons } from "@/features/parts/addFriend/components/AcceptRejectFriendButtons";

type NotificationActionProps = {
  action?: {
    kind: "follow-request" | "friend-request";
    username: string;
  };
};

export function NotificationAction({ action }: NotificationActionProps) {
  if (!action) return null;

  switch (action.kind) {
    case "follow-request":
      return (
        <div data-testid="navbar-notification-action-follow-request">
          <FollowRequestActions
            username={action.username}
            layout="row"
            className="w-full"
          />
        </div>
      );
    case "friend-request":
      return (
        <div data-testid="navbar-notification-action-friend-request">
          <AcceptRejectFriendButtons
            profileUsername={action.username}
            className="w-full"
          />
        </div>
      );
    default:
      return null;
  }
}

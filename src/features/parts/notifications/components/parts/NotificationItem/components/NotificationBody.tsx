import { NotificationContent } from "../../NotificationContent";

type NotificationBodyProps = {
  title: string;
  subtitle: string;
  statusLabel?: string;
  statusTone?: "primary" | "success" | "danger";
  createdAt: string;
  isRead: boolean;
  avatar: React.ReactNode;
};

export function NotificationBody({
  title,
  subtitle,
  statusLabel,
  statusTone,
  createdAt,
  isRead,
  avatar,
}: NotificationBodyProps) {
  return (
    <div
      className="flex items-start gap-3"
      data-testid="navbar-notification-content"
    >
      <NotificationContent
        title={title}
        subtitle={subtitle}
        statusLabel={statusLabel}
        statusTone={statusTone}
        createdAt={createdAt}
        isRead={isRead}
        avatar={avatar}
      />
    </div>
  );
}

import { getInitials } from "./utils";

type AvatarBubbleProps = {
  name: string;
  avatarUrl?: string;
};

export function AvatarBubble({ name, avatarUrl }: AvatarBubbleProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="h-12 w-12 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
      {getInitials(name)}
    </span>
  );
}

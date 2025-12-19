import { getInitials } from "./utils";

type AvatarBubbleProps = {
  name: string;
  avatarUrl?: string;
  className?: string;
  imageClassName?: string;
};

export function AvatarBubble({
  name,
  avatarUrl,
  className = "h-12 w-12",
  imageClassName = "h-12 w-12",
}: AvatarBubbleProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${imageClassName} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}

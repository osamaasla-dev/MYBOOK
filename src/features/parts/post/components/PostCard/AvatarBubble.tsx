import { getInitials } from "./utils";

type AvatarBubbleProps = {
  name: string;
  avatarUrl?: string;
  className?: string;
  imageClassName?: string;
  testId?: string;
};

export function AvatarBubble({
  name,
  avatarUrl,
  className = "h-12 w-12",
  imageClassName = "h-12 w-12",
  testId,
}: AvatarBubbleProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className={`${imageClassName} rounded-full object-cover bg-white`}
        referrerPolicy="no-referrer"
        data-testid={testId}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ${className}`}
      data-testid={testId}
      aria-label={`${name} initials: ${getInitials(name)}`}
    >
      {getInitials(name)}
    </span>
  );
}

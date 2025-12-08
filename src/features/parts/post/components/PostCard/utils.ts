export function formatRelativeTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return "";

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = month * 12;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  if (diffMs < month) return `${Math.floor(diffMs / day)} days ago`;
  if (diffMs < year) return `${Math.floor(diffMs / month)} months ago`;
  return `${Math.floor(diffMs / year)} years ago`;
}

export function formatCount(value?: number) {
  if (typeof value !== "number") return "";
  if (value < 1000) return value.toString();
  if (value < 1000000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function getInitials(name: string) {
  if (!name) return "?";
  const [first, second] = name.trim().split(/\s+/);
  if (!second) return first.charAt(0).toUpperCase();
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

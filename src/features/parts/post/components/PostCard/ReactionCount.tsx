import { formatCount } from "./utils";

type ReactionCountProps = {
  count: number;
  testId?: string;
};

export function ReactionCount({ count, testId }: ReactionCountProps) {
  return (
    <span className="text-md" data-testid={testId}>
      {formatCount(count)}
    </span>
  );
}

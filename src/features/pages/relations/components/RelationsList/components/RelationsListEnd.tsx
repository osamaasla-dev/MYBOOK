type RelationsListEndProps = {
  testId?: string;
};

export function RelationsListEnd({
  testId = "relations-list-end",
}: RelationsListEndProps) {
  return (
    <div
      className="px-4 py-4 text-center text-xs text-muted-foreground"
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      You have reached the end.
    </div>
  );
}

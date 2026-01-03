export function Spinner({ testId = "spinner" }: { testId?: string }) {
  return (
    <>
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-testid={testId}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </>
  );
}

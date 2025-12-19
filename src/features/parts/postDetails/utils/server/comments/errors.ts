export class CommentRouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isCommentRouteError(
  error: unknown
): error is CommentRouteError {
  return error instanceof CommentRouteError;
}

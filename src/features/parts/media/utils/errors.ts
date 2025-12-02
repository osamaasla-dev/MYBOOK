import { uploadMessages } from "@/lib/messages";

export type UploadMessageKey = keyof typeof uploadMessages;

type MediaUploadErrorOptions = {
  message?: string;
  details?: unknown;
};

export class MediaUploadError extends Error {
  readonly statusCode: number;
  readonly messageKey: UploadMessageKey;
  readonly details?: unknown;

  constructor(
    messageKey: UploadMessageKey,
    statusCode: number,
    options?: MediaUploadErrorOptions
  ) {
    super(options?.message ?? uploadMessages[messageKey]);
    this.name = "MediaUploadError";
    this.messageKey = messageKey;
    this.statusCode = statusCode;
    this.details = options?.details;
  }
}

export function isMediaUploadError(error: unknown): error is MediaUploadError {
  return error instanceof MediaUploadError;
}

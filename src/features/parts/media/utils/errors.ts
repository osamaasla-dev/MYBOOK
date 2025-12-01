import { uploadMessages } from "@/lib/messages";

export type UploadMessageKey = keyof typeof uploadMessages;

export class MediaUploadError extends Error {
  readonly statusCode: number;
  readonly messageKey: UploadMessageKey;

  constructor(messageKey: UploadMessageKey, statusCode: number) {
    super(uploadMessages[messageKey]);
    this.name = "MediaUploadError";
    this.messageKey = messageKey;
    this.statusCode = statusCode;
  }
}

export function isMediaUploadError(error: unknown): error is MediaUploadError {
  return error instanceof MediaUploadError;
}

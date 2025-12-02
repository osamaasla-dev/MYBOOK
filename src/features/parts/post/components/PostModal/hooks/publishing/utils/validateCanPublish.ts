import { postMessages } from "@/lib/messages";

export function validateCanPublish(canPublish: boolean) {
  if (!canPublish) {
    return postMessages.PUBLISHING_MESSAGES.missingContentOrMedia;
  }

  return null;
}

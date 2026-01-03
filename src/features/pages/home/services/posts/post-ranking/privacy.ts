import { Visibility, PostVisibilityPreference } from "@prisma/client";

export function resolveEffectiveVisibility(
  postVisibility: Visibility,
  preference: PostVisibilityPreference,
  authorDefaultVisibility: Visibility
) {
  return preference === PostVisibilityPreference.OVERRIDE
    ? postVisibility
    : authorDefaultVisibility;
}

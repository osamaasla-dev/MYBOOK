import {
  usernameSchema,
  type ProfileUserRecord,
} from "@/features/pages/profile/types";

export function normalizeFollowUsername(username?: string): string | null {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return null;
  }
  return parsed.data.toLowerCase();
}

export type FollowTargetValidationResult =
  | { ok: true; profile: ProfileUserRecord; requiresApproval: boolean }
  | { ok: false; reason: "NOT_FOUND" | "SELF" };

export function validateFollowTarget(
  profile: ProfileUserRecord | null,
  viewerId: string
): FollowTargetValidationResult {
  if (!profile) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (profile.id === viewerId) {
    return { ok: false, reason: "SELF" };
  }

  return {
    ok: true,
    profile,
    requiresApproval: profile.isPrivate,
  };
}

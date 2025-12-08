import { HALF_LIFE_HOURS } from "./constants";
import type { ImportantUserScore, RawInteractionCandidate } from "./types";

const HOUR_IN_MS = 1000 * 60 * 60;

export function computeDecayFactor(
  lastInteractionAt: Date | null,
  now: Date = new Date()
) {
  if (!lastInteractionAt) return 1;

  const hoursSince = (now.getTime() - lastInteractionAt.getTime()) / HOUR_IN_MS;
  if (!Number.isFinite(hoursSince) || hoursSince <= 0) return 1;

  const decayFactor = Math.pow(0.5, hoursSince / HALF_LIFE_HOURS);
  return Math.max(0, Math.min(1, decayFactor));
}

export function scoreInteractionCandidate(
  candidate: RawInteractionCandidate,
  now: Date = new Date()
): ImportantUserScore {
  const decayFactor = computeDecayFactor(candidate.lastInteractionAt, now);
  const rawScore = candidate.interactionWeight * decayFactor;
  const score = Number.isFinite(rawScore) ? rawScore : 0;

  return {
    targetUserId: candidate.targetUserId,
    interactionWeight: candidate.interactionWeight,
    decayFactor,
    lastInteractionAt: candidate.lastInteractionAt,
    score,
  };
}

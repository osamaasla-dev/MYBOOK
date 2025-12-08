import {
  FINAL_SELECTION_BASE,
  FINAL_SELECTION_MAX,
  FINAL_SELECTION_MIN,
  INTERACTION_CANDIDATE_BASE,
  INTERACTION_CANDIDATE_MAX,
  INTERACTION_CANDIDATE_MIN,
} from "./constants";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function determineCandidateCount(totalRelations: number) {
  if (totalRelations <= 0) return INTERACTION_CANDIDATE_MIN;
  const scale = Math.log10(totalRelations + 1);
  const proposed = Math.round(INTERACTION_CANDIDATE_BASE * (1 + scale / 2));
  return clamp(proposed, INTERACTION_CANDIDATE_MIN, INTERACTION_CANDIDATE_MAX);
}

export function determineFinalSelectionCount(candidateCount: number) {
  if (candidateCount <= 0) return FINAL_SELECTION_MIN;
  const proportion = candidateCount / INTERACTION_CANDIDATE_BASE;
  const proposed = Math.round(FINAL_SELECTION_BASE * proportion);
  return clamp(proposed, FINAL_SELECTION_MIN, FINAL_SELECTION_MAX);
}

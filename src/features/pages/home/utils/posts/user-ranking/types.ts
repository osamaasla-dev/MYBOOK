export type ImportantUserScore = {
  targetUserId: string;
  score: number;
  interactionWeight: number;
  decayFactor: number;
  lastInteractionAt: Date | null;
};

export type RawInteractionCandidate = {
  targetUserId: string;
  interactionWeight: number;
  lastInteractionAt: Date | null;
};

export const MODERATION_CONTEXTS = ["post", "comment", "message"] as const;
export type ModerationContext = (typeof MODERATION_CONTEXTS)[number];

export type ModerationEvaluation = {
  severity_score?: number;
  flag_probability?: number;
  flagged?: boolean;
};

export type ModerationAPIResponse = {
  data?: {
    evaluation?: ModerationEvaluation;
  };
};

export type ModerationCheckResult = {
  context: ModerationContext;
  severity: number;
};

export type ModerationDecisionStatus = "allow" | "reject";

export type ModerationDecision = {
  context: ModerationContext;
  severity: number;
  threshold: number;
  status: ModerationDecisionStatus;
};

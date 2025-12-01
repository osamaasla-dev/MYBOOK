import ModerationAPI from "@moderation-api/sdk";

import { decideModerationAction } from "@/features/parts/moderation/constants/moderationThresholds";
import type {
  ModerationAPIResponse,
  ModerationCheckResult,
  ModerationContext,
  ModerationDecision,
} from "@/features/types";

export class MissingModerationAPIKeyError extends Error {
  constructor() {
    super("MODAPI_SECRET_KEY is not configured");
    this.name = "MissingModerationAPIKeyError";
  }
}

export class ModerationProviderError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = "ModerationProviderError";
    this.status = status;
    this.details = details;
  }
}

function extractSeverity(response: ModerationAPIResponse): number {
  const evaluation = response.data?.evaluation;
  if (!evaluation) {
    return 0;
  }

  if (typeof evaluation.severity_score === "number") {
    return evaluation.severity_score;
  }

  if (typeof evaluation.flag_probability === "number") {
    return evaluation.flag_probability;
  }

  return evaluation.flagged ? 1 : 0;
}

const MODERATION_API_KEY = process.env.MODAPI_SECRET_KEY;

export type ModerationOutcome = ModerationCheckResult;

type ModerationContentInput =
  | { type: "text"; text: string }
  | { type: "image"; imageUrl: string }
  | { type: "video"; videoUrl: string };

let client: ModerationAPI | null = null;

function getClient(): ModerationAPI {
  if (!MODERATION_API_KEY) {
    throw new MissingModerationAPIKeyError();
  }

  if (!client) {
    client = new ModerationAPI({ key: MODERATION_API_KEY });
  }

  return client;
}

export async function checkModeration(
  content: string,
  context: ModerationContext
): Promise<ModerationOutcome> {
  return submitModerationContent({ type: "text", text: content }, context);
}

export async function checkImageModeration(
  imageUrl: string,
  context: ModerationContext
): Promise<ModerationOutcome> {
  return submitModerationContent({ type: "image", imageUrl }, context);
}

export async function checkVideoModeration(
  videoUrl: string,
  context: ModerationContext
): Promise<ModerationOutcome> {
  return submitModerationContent({ type: "video", videoUrl }, context);
}

export async function moderateText(
  content: string,
  context: ModerationContext
): Promise<ModerationDecision> {
  const outcome = await checkModeration(content, context);
  return decideModerationAction(outcome.context, outcome.severity);
}

export async function moderateImage(
  imageUrl: string,
  context: ModerationContext
): Promise<ModerationDecision> {
  const outcome = await checkImageModeration(imageUrl, context);
  return decideModerationAction(outcome.context, outcome.severity);
}

export async function moderateVideo(
  videoUrl: string,
  context: ModerationContext
): Promise<ModerationDecision> {
  const outcome = await checkVideoModeration(videoUrl, context);
  return decideModerationAction(outcome.context, outcome.severity);
}

async function submitModerationContent(
  input: ModerationContentInput,
  context: ModerationContext
): Promise<ModerationOutcome> {
  const moderationClient = getClient();

  try {
    const result = (await moderationClient.content.submit({
      content: normalizeContentInput(input),
    })) as ModerationAPIResponse;

    console.info(
      JSON.stringify({
        msg: "moderation_api_response",
        evaluation: result.data?.evaluation,
      })
    );

    return {
      context,
      severity: extractSeverity(result),
    };
  } catch (error) {
    const err = error as {
      status?: number;
      message?: string;
      response?: {
        status?: number;
        data?: { message?: string; error?: unknown };
      };
    };

    const status = err?.response?.status ?? err?.status ?? 500;
    const message =
      err?.response?.data?.message ??
      err?.message ??
      "Moderation API request failed";

    const details = err?.response?.data?.error
      ? JSON.stringify(err.response.data.error)
      : undefined;

    throw new ModerationProviderError(status, message, details);
  }
}

function normalizeContentInput(input: ModerationContentInput) {
  switch (input.type) {
    case "text":
      return { type: "text" as const, text: input.text };
    case "image":
      return { type: "image" as const, url: input.imageUrl };
    case "video":
      return { type: "video" as const, url: input.videoUrl };
    default:
      return input satisfies never;
  }
}

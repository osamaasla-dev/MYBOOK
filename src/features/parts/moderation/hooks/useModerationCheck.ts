"use client";

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ModerationCheckResult } from "../types/moderationTypes";
import { CheckModerationInput } from "../schemas/checkModerationSchema";
import { submitModerationRequest } from "../services/client";

export const MODERATION_MUTATION_KEY = ["moderation", "check"] as const;

export function useModerationCheck(
  options?: UseMutationOptions<
    ModerationCheckResult,
    Error,
    CheckModerationInput,
    unknown
  >
): UseMutationResult<
  ModerationCheckResult,
  Error,
  CheckModerationInput,
  unknown
> {
  return useMutation<ModerationCheckResult, Error, CheckModerationInput>({
    mutationKey: MODERATION_MUTATION_KEY,
    mutationFn: submitModerationRequest,
    ...options,
  });
}

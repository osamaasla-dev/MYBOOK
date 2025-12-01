"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { uploadMedia } from "../services";
import type { UploadMediaResponse, UploadMediaVariables } from "../types";

export const MEDIA_UPLOAD_MUTATION_KEY = ["media", "upload"] as const;

export function useMediaUpload(
  options?: UseMutationOptions<
    UploadMediaResponse,
    Error,
    UploadMediaVariables,
    unknown
  >
) {
  return useMutation<UploadMediaResponse, Error, UploadMediaVariables>({
    mutationKey: MEDIA_UPLOAD_MUTATION_KEY,
    mutationFn: uploadMedia,
    ...options,
  });
}

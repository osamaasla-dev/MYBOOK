import type {
  ModerationContext,
  ModerationDecisionStatus,
} from "@/features/types";

export type MediaResourceType = "image" | "video" | "auto";

export type UploadMediaVariables = {
  file: File;
  folder?: string;
  folderType?: string;
  resourceType?: MediaResourceType;
  context?: ModerationContext;
};

export type UploadMediaResponse = {
  moderationSeverity: number;
  moderationContext: ModerationContext;
  moderationThreshold: number;
  moderationStatus: ModerationDecisionStatus;
  asset?: MediaAssetPayload;
};

export type MediaAssetPayload = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  folder: string;
  type: string;
  duration: number | null;
  frames: number | null;
  frameRate: string | null;
};

export type SessionLike = {
  user?: {
    id?: string | null;
  } | null;
} | null;

export type MediaUploadInputs = {
  file: File;
  resourceType: MediaResourceType;
  folderType: string;
  baseFolder: string;
  moderationContext: ModerationContext;
};

export type MediaMetadata = MediaAssetPayload & {
  moderationSeverity?: number;
  moderationContext?: ModerationContext;
  moderationThreshold?: number;
  moderationStatus?: ModerationDecisionStatus;
};

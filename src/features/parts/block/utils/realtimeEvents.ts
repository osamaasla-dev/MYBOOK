export type BlockRealtimeKind = "blocked" | "unblocked";

export type BlockRealtimeEvent = "block:created" | "block:removed";

export const BLOCK_CREATED_EVENT: BlockRealtimeEvent = "block:created";
export const BLOCK_REMOVED_EVENT: BlockRealtimeEvent = "block:removed";

export type BlockRealtimePayload = {
  blockerId: string;
  blockerUsername?: string | null;
  blockedId: string;
  blockedUsername?: string | null;
  kind: BlockRealtimeKind;
};

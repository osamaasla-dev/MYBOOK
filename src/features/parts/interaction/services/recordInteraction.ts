import { prisma } from "@/lib/prisma";

import { getRequestLog } from "@/lib/request-log";

import { COUNTER_FIELD_MAP, INTERACTION_WEIGHTS } from "./constants";
import { incrementTotalInteractedUsers } from "./helpers";
import type { RecordInteractionInput, InteractionType } from "./types";

const now = () => new Date();

function getWeightDelta(type: InteractionType) {
  return INTERACTION_WEIGHTS[type] ?? 0;
}

export async function recordInteraction({
  actorId,
  targetUserId,
  type,
}: RecordInteractionInput) {
  const { log } = await getRequestLog({ route: "interaction:record" });
  if (!actorId || !targetUserId) {
    log.warn("recordInteraction missing actor or target");
    return;
  }
  if (actorId === targetUserId) {
    log.warn({ actorId }, "recordInteraction actor equals target");
    return;
  }

  const fields = COUNTER_FIELD_MAP[type];
  const weightDelta = getWeightDelta(type);
  const timestamp = now();
  const existing = await prisma.userInteractionStats.findUnique({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    select: { userId: true },
  });

  await prisma.userInteractionStats.upsert({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    update: {
      [fields.counter]: { increment: 1 },
      [fields.timestamp]: timestamp,
      ...(weightDelta
        ? {
            interactionWeight: { increment: weightDelta },
            ...(weightDelta > 0 ? { lastInteractionAt: timestamp } : {}),
          }
        : {}),
    },
    create: {
      userId: actorId,
      targetUserId,
      [fields.counter]: 1,
      [fields.timestamp]: timestamp,
      interactionWeight: weightDelta,
      lastInteractionAt: weightDelta > 0 ? timestamp : null,
    },
  });

  if (!existing) {
    await incrementTotalInteractedUsers(prisma, actorId);
  }
}

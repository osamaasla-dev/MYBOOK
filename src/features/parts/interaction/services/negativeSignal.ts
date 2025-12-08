import { prisma } from "@/lib/prisma";

import { getRequestLog } from "@/lib/request-log";

import { INTERACTION_WEIGHTS } from "./constants";
import { incrementTotalInteractedUsers } from "./helpers";
import type { NegativeSignalInput } from "./types";

export async function applyNegativeSignal({
  actorId,
  targetUserId,
  type,
}: NegativeSignalInput) {
  const { log } = await getRequestLog({ route: "interaction:negativeSignal" });
  if (!actorId || !targetUserId) {
    log.warn("applyNegativeSignal missing actor or target");
    return;
  }
  if (actorId === targetUserId) {
    log.warn({ actorId }, "applyNegativeSignal actor equals target");
    return;
  }

  const delta = INTERACTION_WEIGHTS[type];
  if (typeof delta !== "number") {
    log.error({ type }, "applyNegativeSignal invalid interaction weight key");
    return;
  }
  if (delta >= 0) {
    log.warn({ type }, "applyNegativeSignal received non-negative weight");
    return;
  }

  const existing = await prisma.userInteractionStats.findUnique({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    select: { userId: true },
  });

  log.info({ actorId, targetUserId, type, delta }, "applyNegativeSignal");
  await prisma.userInteractionStats.upsert({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    update: {
      interactionWeight: { increment: delta },
    },
    create: {
      userId: actorId,
      targetUserId,
      interactionWeight: delta,
    },
  });

  if (!existing) {
    await incrementTotalInteractedUsers(prisma, actorId);
  }
}

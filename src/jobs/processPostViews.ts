import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  consumePendingPostViews,
  type PendingPostViewEntry,
} from "@/features/parts/post/utils/views";

const JOB_LABEL = "jobs:post-views";

function groupViewsByPost(entries: PendingPostViewEntry[]) {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.postId] = (acc[entry.postId] ?? 0) + 1;
    return acc;
  }, {});
}

function dedupeEntries(entries: PendingPostViewEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const identityKey = entry.viewerId
      ? `user:${entry.viewerId}`
      : entry.sessionHash
      ? `anon:${entry.sessionHash}`
      : `anon:${entry.ip ?? entry.userAgent ?? "unknown"}`;
    const key = `${entry.postId}:${identityKey}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function runPostViewsAggregationJob() {
  const log = logger.child({ route: JOB_LABEL });

  try {
    const entries = await consumePendingPostViews(log);
    if (!entries.length) {
      log.info("No pending post views to process");
      return;
    }

    const dedupedEntries = dedupeEntries(entries);
    if (!dedupedEntries.length) {
      log.info(
        { totalEntries: entries.length },
        "All pending entries were duplicates"
      );
      return;
    }

    const grouped = groupViewsByPost(dedupedEntries);

    await prisma.$transaction(
      async (tx) => {
        await tx.postView.createMany({
          data: dedupedEntries.map((entry) => ({
            postId: entry.postId,
            viewerId: entry.viewerId,
            sessionHash: entry.sessionHash,
            country: entry.countryCode,
            device: entry.userAgent,
            metadata: {
              ip: entry.ip,
              recordedAt: entry.recordedAt,
            },
          })),
        });

        await Promise.all(
          Object.entries(grouped).map(([postId, amount]) =>
            tx.post.update({
              where: { id: postId },
              data: {
                viewCount: {
                  increment: amount,
                },
              },
            })
          )
        );
      },
      { timeout: 15_000 }
    );

    log.info(
      {
        processedEntries: entries.length,
        dedupedEntries: dedupedEntries.length,
        affectedPosts: Object.keys(grouped).length,
      },
      "Post views aggregation job completed"
    );
  } catch (error) {
    log.error({ error }, "Post views aggregation job failed");
    throw error;
  }
}

if (require.main === module) {
  runPostViewsAggregationJob().catch((error) => {
    console.error("Post views job exited with error", error);
    process.exitCode = 1;
  });
}

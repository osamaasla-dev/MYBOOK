import type { SearchClient } from "algoliasearch";

function chunkArray<T>(items: T[], chunkSize: number) {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function saveObjectsInChunks(
  client: SearchClient,
  indexName: string,
  objects: Array<Record<string, unknown>>,
  chunkSize: number
) {
  const chunks = chunkArray(objects, chunkSize);
  const results: unknown[] = [];

  for (const chunk of chunks) {
    const res = await client.saveObjects({ indexName, objects: chunk });
    if ("taskID" in res && typeof res.taskID === "number") {
      await client.waitForTask({ indexName, taskID: res.taskID });
    }
    results.push(res);
  }

  return results;
}

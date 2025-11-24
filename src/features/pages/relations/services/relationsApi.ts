import { apiGetR } from "@/lib/api";

import type { RelationTab, RelationsListResult } from "../types";

export type RelationsApiParams = {
  tab: RelationTab;
  limit?: number;
  cursor?: string;
};

const buildRelationsQuery = ({ tab, limit, cursor }: RelationsApiParams) => {
  const params = new URLSearchParams({ tab });

  if (limit) {
    params.set("limit", String(limit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export async function fetchRelationsPage(
  params: RelationsApiParams
): Promise<RelationsListResult> {
  const query = buildRelationsQuery(params);
  const { data } = await apiGetR<RelationsListResult>(`/me/relations${query}`);

  return data;
}

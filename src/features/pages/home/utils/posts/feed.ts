export type HomeFeedQueryParams = {
  cursor?: number;
  pageSize?: number;
};

export function buildHomeFeedQuery(params: HomeFeedQueryParams) {
  const searchParams = new URLSearchParams();

  if (typeof params.cursor === "number") {
    searchParams.set("cursor", String(params.cursor));
  }

  if (typeof params.pageSize === "number") {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

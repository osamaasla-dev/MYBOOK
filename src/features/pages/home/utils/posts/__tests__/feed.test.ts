import { buildHomeFeedQuery, type HomeFeedQueryParams } from "../feed";

describe("buildHomeFeedQuery", () => {
  const build = (params: Partial<HomeFeedQueryParams>) =>
    buildHomeFeedQuery(params as HomeFeedQueryParams);

  it("returns an empty string when no params are provided", () => {
    expect(build({})).toBe("");
  });

  it("serializes cursor and pageSize when both are provided", () => {
    expect(
      build({
        cursor: 25,
        pageSize: 15,
      })
    ).toBe("?cursor=25&pageSize=15");
  });

  it("preserves zero values and omits undefined params", () => {
    expect(
      build({
        cursor: 0,
        pageSize: undefined,
      })
    ).toBe("?cursor=0");
  });
});

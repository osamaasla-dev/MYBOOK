import { parseFeedParams } from "../parseFeedParams";
import type { Logger } from "pino";

jest.mock("@/lib/apiResponse", () => ({
  apiResponse: jest.fn(),
}));

jest.mock("@/lib/messages", () => ({
  userMessages: { invalidParams: "Invalid parameters" },
}));

const { apiResponse } = jest.requireMock("@/lib/apiResponse") as {
  apiResponse: jest.Mock;
};

const mockLog = {
  warn: jest.fn(),
} as unknown as Logger;

describe("parseFeedParams", () => {
  const requestId = "req-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty object when no params provided", () => {
    const search = new URLSearchParams();
    const result = parseFeedParams(search, mockLog, requestId);
    expect(result).toEqual({ cursor: undefined, pageSize: undefined });
    expect(apiResponse).not.toHaveBeenCalled();
  });

  it("parses valid cursor and pageSize", () => {
    const search = new URLSearchParams({ cursor: "25", pageSize: "15" });
    const result = parseFeedParams(search, mockLog, requestId);
    expect(result).toEqual({ cursor: 25, pageSize: 15 });
  });

  it("returns error when cursor is NaN", () => {
    const search = new URLSearchParams({ cursor: "abc" });
    const result = parseFeedParams(search, mockLog, requestId);
    expect(result).toHaveProperty("error");
    expect(apiResponse).toHaveBeenCalledWith(
      false,
      {},
      "Invalid parameters",
      400,
      requestId
    );
    expect(mockLog.warn).toHaveBeenCalledWith("Invalid cursor param");
  });

  it("returns error when pageSize is NaN or <= 0", () => {
    const searchNaN = new URLSearchParams({ pageSize: "xyz" });
    const resultNaN = parseFeedParams(searchNaN, mockLog, requestId);
    expect(resultNaN).toHaveProperty("error");
    expect(apiResponse).toHaveBeenCalledWith(
      false,
      { posts: [], nextCursor: null },
      "Invalid parameters",
      400,
      requestId
    );
    expect(mockLog.warn).toHaveBeenCalledWith("Invalid pageSize param");

    jest.clearAllMocks();
    const searchZero = new URLSearchParams({ pageSize: "0" });
    const resultZero = parseFeedParams(searchZero, mockLog, requestId);
    expect(resultZero).toHaveProperty("error");
    expect(apiResponse).toHaveBeenCalledWith(
      false,
      { posts: [], nextCursor: null },
      "Invalid parameters",
      400,
      requestId
    );
    expect(mockLog.warn).toHaveBeenCalledWith("Invalid pageSize param");
  });

  it("allows cursor zero but treats pageSize zero as invalid", () => {
    const search = new URLSearchParams({ cursor: "0", pageSize: "10" });
    const result = parseFeedParams(search, mockLog, requestId);
    expect(result).toEqual({ cursor: 0, pageSize: 10 });
  });
});

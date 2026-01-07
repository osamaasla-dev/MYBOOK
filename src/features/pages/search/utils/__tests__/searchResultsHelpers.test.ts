import { normalizeRankedUserRow } from "../searchResultsHelpers";
import type {
  RankedUserRow,
  NormalizedRankedUserRow,
} from "../../types/searchTypes";

// Helper type for test cases
type BooleanTestCase = {
  input: number | string | boolean | null | undefined;
  expected: boolean;
};

describe("normalizeRankedUserRow", () => {
  const createMockRow = (
    overrides: Partial<RankedUserRow> = {}
  ): RankedUserRow => ({
    id: "user-123",
    name: "John Doe",
    username: "johndoe",
    avatarUrl: "https://example.com/avatar.jpg",
    is_friend: 1,
    is_following: 0,
    priority_bucket: 3,
    weight_sort: 100,
    name_sort: "john doe",
    ...overrides,
  });

  describe("basic functionality", () => {
    it("should normalize a complete user row correctly", () => {
      const mockRow = createMockRow();
      const expected: NormalizedRankedUserRow = {
        id: "user-123",
        name: "John Doe",
        username: "johndoe",
        avatarUrl: "https://example.com/avatar.jpg",
        is_friend: true,
        is_following: false,
        priority_bucket: 3,
        weight_sort: 100,
        name_sort: "john doe",
      };

      const result = normalizeRankedUserRow(mockRow);

      expect(result).toEqual(expected);
    });

    it("should handle null/undefined values gracefully", () => {
      const mockRow = createMockRow({
        avatarUrl: null,
        is_friend: 0,
        is_following: 0,
      });

      const result = normalizeRankedUserRow(mockRow);

      expect(result.avatarUrl).toBeNull();
      expect(result.is_friend).toBe(false);
      expect(result.is_following).toBe(false);
    });
  });

  describe("type conversion", () => {
    it("should convert bigint priority_bucket to number", () => {
      const mockRow = createMockRow({ priority_bucket: BigInt(5) });
      const result = normalizeRankedUserRow(mockRow);

      expect(result.priority_bucket).toBe(5);
      expect(typeof result.priority_bucket).toBe("number");
    });

    it("should handle number priority_bucket", () => {
      const mockRow = createMockRow({ priority_bucket: 5 });
      const result = normalizeRankedUserRow(mockRow);

      expect(result.priority_bucket).toBe(5);
      expect(typeof result.priority_bucket).toBe("number");
    });

    it("should convert bigint weight_sort to number", () => {
      const mockRow = createMockRow({ weight_sort: BigInt(250) });
      const result = normalizeRankedUserRow(mockRow);

      expect(result.weight_sort).toBe(250);
      expect(typeof result.weight_sort).toBe("number");
    });

    it("should handle number weight_sort", () => {
      const mockRow = createMockRow({ weight_sort: 250 });
      const result = normalizeRankedUserRow(mockRow);

      expect(result.weight_sort).toBe(250);
      expect(typeof result.weight_sort).toBe("number");
    });
  });

  describe("Boolean conversion", () => {
    it("should convert is_friend truthy values to true", () => {
      const testCases: BooleanTestCase[] = [
        { input: 1, expected: true },
        { input: 2, expected: true },
        { input: -1, expected: true },
        { input: "1", expected: true },
        { input: true, expected: true },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockRow = createMockRow({
          is_friend: input as RankedUserRow["is_friend"],
        });
        const result = normalizeRankedUserRow(mockRow);
        expect(result.is_friend).toBe(expected);
      });
    });

    it("should convert is_friend falsy values to false", () => {
      const testCases: BooleanTestCase[] = [
        { input: 0, expected: false },
        { input: null, expected: false },
        { input: undefined, expected: false },
        { input: false, expected: false },
        { input: "", expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockRow = createMockRow({
          is_friend: input as RankedUserRow["is_friend"],
        });
        const result = normalizeRankedUserRow(mockRow);
        expect(result.is_friend).toBe(expected);
      });
    });

    it("should convert is_following truthy values to true", () => {
      const testCases: BooleanTestCase[] = [
        { input: 1, expected: true },
        { input: 2, expected: true },
        { input: -1, expected: true },
        { input: "1", expected: true },
        { input: true, expected: true },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockRow = createMockRow({
          is_following: input as RankedUserRow["is_following"],
        });
        const result = normalizeRankedUserRow(mockRow);
        expect(result.is_following).toBe(expected);
      });
    });

    it("should convert is_following falsy values to false", () => {
      const testCases: BooleanTestCase[] = [
        { input: 0, expected: false },
        { input: null, expected: false },
        { input: undefined, expected: false },
        { input: false, expected: false },
        { input: "", expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockRow = createMockRow({
          is_following: input as RankedUserRow["is_following"],
        });
        const result = normalizeRankedUserRow(mockRow);
        expect(result.is_following).toBe(expected);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle zero bigint values", () => {
      const mockRow = createMockRow({
        priority_bucket: BigInt(0),
        weight_sort: BigInt(0),
      });

      const result = normalizeRankedUserRow(mockRow);

      expect(result.priority_bucket).toBe(0);
      expect(result.weight_sort).toBe(0);
    });

    it("should handle negative number values", () => {
      const mockRow = createMockRow({
        priority_bucket: -5,
        weight_sort: -100,
      });

      const result = normalizeRankedUserRow(mockRow);

      expect(result.priority_bucket).toBe(-5);
      expect(result.weight_sort).toBe(-100);
    });

    it("should preserve string fields as-is", () => {
      const mockRow = createMockRow({
        name: "Jane Smith",
        username: "janesmith",
        name_sort: "jane smith",
      });

      const result = normalizeRankedUserRow(mockRow);

      expect(result.name).toBe("Jane Smith");
      expect(result.username).toBe("janesmith");
      expect(result.name_sort).toBe("jane smith");
    });
  });

  describe("immutability", () => {
    it("should not modify the original row object", () => {
      const originalRow = createMockRow();
      const originalRowString = JSON.stringify(originalRow);

      normalizeRankedUserRow(originalRow);

      expect(JSON.stringify(originalRow)).toBe(originalRowString);
    });
  });
});

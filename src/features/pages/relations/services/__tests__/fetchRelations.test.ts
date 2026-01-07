import { fetchRelationsList } from "../fetchRelations";
import type {
  FetchRelationsInput,
  RelationsListResult,
  RelationTab,
  RelationListItem,
} from "../../types";

// Mock the fetchers module
jest.mock("../fetchers", () => ({
  fetchFollowers: jest.fn(),
  fetchFollowing: jest.fn(),
  fetchFollowRequests: jest.fn(),
  fetchSentFollowRequests: jest.fn(),
  fetchFriends: jest.fn(),
  fetchFriendRequests: jest.fn(),
  fetchSentFriendRequests: jest.fn(),
  fetchBlocked: jest.fn(),
}));

// Import the mocked fetchers
import { fetchFollowers, fetchFollowing } from "../fetchers";

// Type the mocked functions
const mockedFetchFollowers = fetchFollowers as jest.MockedFunction<
  typeof fetchFollowers
>;
const mockedFetchFollowing = fetchFollowing as jest.MockedFunction<
  typeof fetchFollowing
>;

// Helper functions for test data creation
const createTestInput = (
  overrides: Partial<FetchRelationsInput> = {}
): FetchRelationsInput => ({
  userId: "user-123",
  tab: "followers" as RelationTab,
  limit: 10,
  cursor: undefined,
  ...overrides,
});

const createTestRecord = (
  id: string,
  name: string,
  createdAt?: string
): RelationListItem => ({
  id,
  tab: "followers" as RelationTab,
  user: {
    id,
    username: name,
    name,
    avatarUrl: null,
    bio: null,
  },
  createdAt: createdAt || new Date().toISOString(),
});

const createExpectedResult = (
  items: RelationListItem[] = [],
  nextCursor: string | null = null,
  hasNextPage: boolean = false,
  overrides: Partial<RelationsListResult> = {}
): RelationsListResult => ({
  items,
  nextCursor,
  hasNextPage,
  ...overrides,
});

// Helper to create test case data
const createTestCase = (
  name: string,
  inputOverrides: Partial<FetchRelationsInput>,
  mockRecords: RelationListItem[],
  expectedItems: RelationListItem[],
  nextCursor: string | null = null,
  hasNextPage: boolean = false
) => ({
  name,
  inputOverrides,
  mockRecords,
  expected: createExpectedResult(expectedItems, nextCursor, hasNextPage),
});

// Helper to setup and run test
const runTest = async (
  inputOverrides: Partial<FetchRelationsInput>,
  mockRecords: RelationListItem[],
  expected: RelationsListResult,
  mockFetcher: jest.MockedFunction<
    (args: {
      userId: string;
      take: number;
      cursor?: string | undefined;
    }) => Promise<RelationListItem[]>
  >
) => {
  const input = createTestInput(inputOverrides);
  mockFetcher.mockResolvedValue(mockRecords);
  const result = await fetchRelationsList(input);
  expect(mockFetcher).toHaveBeenCalledWith({
    userId: input.userId,
    take: expect.any(Number),
    cursor: input.cursor,
  });
  expect(result).toEqual(expected);
};

describe("fetchRelationsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("success cases", () => {
    it.each([
      createTestCase(
        "should fetch first page with no cursor",
        { cursor: undefined },
        [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
          createTestRecord("2", "User 2", "2025-01-01T00:00:00.000Z"),
        ],
        [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
          createTestRecord("2", "User 2", "2025-01-01T00:00:00.000Z"),
        ]
      ),
      createTestCase(
        "should fetch page with cursor",
        { cursor: "cursor-123" },
        [
          createTestRecord("3", "User 3", "2025-01-01T00:00:00.000Z"),
          createTestRecord("4", "User 4", "2025-01-01T00:00:00.000Z"),
          createTestRecord("5", "User 5", "2025-01-01T00:00:00.000Z"),
        ],
        [
          createTestRecord("3", "User 3", "2025-01-01T00:00:00.000Z"),
          createTestRecord("4", "User 4", "2025-01-01T00:00:00.000Z"),
          createTestRecord("5", "User 5", "2025-01-01T00:00:00.000Z"),
        ]
      ),
      createTestCase(
        "should handle limit correctly",
        { limit: 3 },
        [
          createTestRecord("6", "User 6", "2025-01-01T00:00:00.000Z"),
          createTestRecord("7", "User 7", "2025-01-01T00:00:00.000Z"),
          createTestRecord("8", "User 8", "2025-01-01T00:00:00.000Z"),
          createTestRecord("9", "User 9", "2025-01-01T00:00:00.000Z"),
        ],
        [
          createTestRecord("6", "User 6", "2025-01-01T00:00:00.000Z"),
          createTestRecord("7", "User 7", "2025-01-01T00:00:00.000Z"),
          createTestRecord("8", "User 8", "2025-01-01T00:00:00.000Z"),
        ],
        "9",
        true
      ),
    ])("$name", async ({ inputOverrides, mockRecords, expected }) => {
      await runTest(
        inputOverrides,
        mockRecords,
        expected,
        mockedFetchFollowers
      );
    });
  });

  describe("edge cases", () => {
    it.each([createTestCase("should handle empty results", {}, [], [])])(
      "$name",
      async ({ inputOverrides, mockRecords, expected }) => {
        await runTest(
          inputOverrides,
          mockRecords,
          expected,
          mockedFetchFollowers
        );
      }
    );

    it.each([
      {
        name: "should handle single item",
        inputOverrides: {},
        mockRecords: [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
        ],
        expected: createExpectedResult(
          [createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z")],
          null,
          false
        ),
      },
      {
        name: "should handle exact limit match",
        inputOverrides: { limit: 2 },
        mockRecords: [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
          createTestRecord("2", "User 2", "2025-01-01T00:00:00.000Z"),
        ],
        expected: createExpectedResult(
          [
            createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
            createTestRecord("2", "User 2", "2025-01-01T00:00:00.000Z"),
          ],
          null,
          false
        ),
      },
      {
        name: "should handle different tabs",
        inputOverrides: { tab: "following" as RelationTab },
        mockRecords: [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
        ],
        expected: createExpectedResult(
          [createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z")],
          null,
          false
        ),
        mockFetcher: mockedFetchFollowing,
      },
      {
        name: "should handle different user IDs",
        inputOverrides: { userId: "different-user-456" },
        mockRecords: [
          createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z"),
        ],
        expected: createExpectedResult(
          [createTestRecord("1", "User 1", "2025-01-01T00:00:00.000Z")],
          null,
          false
        ),
      },
    ])(
      "$name",
      async ({
        inputOverrides,
        mockRecords,
        expected,
        mockFetcher = mockedFetchFollowers,
      }) => {
        const input = createTestInput(inputOverrides);
        mockFetcher.mockResolvedValue(mockRecords);
        const result = await fetchRelationsList(input);
        expect(mockFetcher).toHaveBeenCalledWith({
          userId: input.userId,
          take: expect.any(Number),
          cursor: input.cursor,
        });
        expect(result).toEqual(expected);
      }
    );
  });

  describe("error handling", () => {
    it("should handle fetcher errors", async () => {
      const input = createTestInput();
      const error = new Error("Database error");

      mockedFetchFollowers.mockRejectedValue(error);

      await expect(fetchRelationsList(input)).rejects.toThrow("Database error");
    });
  });
});

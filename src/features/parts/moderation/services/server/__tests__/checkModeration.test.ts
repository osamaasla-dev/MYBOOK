import type {
  ModerationAPIResponse,
  ModerationDecision,
  ModerationEvaluation,
  ModerationContext,
} from "@/features/types";
import { MODERATION_CHANNEL_NAME } from "../../../constants";

type DecideModerationAction = (
  context: ModerationContext,
  severity: number
) => ModerationDecision;

const decideModerationActionMock = jest.fn<
  ModerationDecision,
  Parameters<DecideModerationAction>
>();

type SubmitPayload = {
  channel: string;
  content:
    | { type: "text"; text: string }
    | { type: "image"; url: string }
    | { type: "video"; url: string };
};

const submitMock = jest.fn<Promise<ModerationAPIResponse>, [SubmitPayload]>();

const MockModerationAPI = jest.fn(() => ({
  content: {
    submit: submitMock,
  },
}));

type CheckModerationModule = typeof import("../checkModeration");

const createApiResponse = (
  evaluation?: ModerationEvaluation
): ModerationAPIResponse => ({
  data: evaluation ? { evaluation } : undefined,
});

async function loadModule(
  modApiKey: string | null = "test-key"
): Promise<CheckModerationModule> {
  jest.resetModules();
  jest.doMock("@moderation-api/sdk", () => ({
    __esModule: true,
    default: MockModerationAPI,
  }));
  jest.doMock("@/features/parts/moderation/utils", () => ({
    decideModerationAction: decideModerationActionMock,
  }));

  if (modApiKey) {
    process.env.MODAPI_SECRET_KEY = modApiKey;
  } else {
    delete process.env.MODAPI_SECRET_KEY;
  }

  return import("../checkModeration");
}

describe("checkModeration service", () => {
  beforeEach(() => {
    submitMock.mockReset();
    MockModerationAPI.mockClear();
    decideModerationActionMock.mockReset();
  });

  afterEach(() => {
    delete process.env.MODAPI_SECRET_KEY;
  });

  describe("API key handling", () => {
    it("throws MissingModerationAPIKeyError when MODAPI_SECRET_KEY is absent", async () => {
      submitMock.mockResolvedValue(createApiResponse());

      const moderationModule = await loadModule(null);

      await expect(
        moderationModule.checkModeration("hello", "post")
      ).rejects.toBeInstanceOf(moderationModule.MissingModerationAPIKeyError);
      expect(submitMock).not.toHaveBeenCalled();
    });

    it("instantiates ModerationAPI only once and reuses the client", async () => {
      submitMock.mockResolvedValue(createApiResponse({ severity_score: 0.12 }));

      const moderationModule = await loadModule();

      await moderationModule.checkModeration("hello", "post");
      await moderationModule.checkImageModeration("https://img", "avatar");

      expect(MockModerationAPI).toHaveBeenCalledTimes(1);
      expect(submitMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("content submission", () => {
    const submissionCases = [
      {
        name: "text content",
        invoke: async (module: CheckModerationModule) =>
          module.checkModeration("hello", "post"),
        expectedContent: { type: "text" as const, text: "hello" },
        expectedContext: "post" as const,
      },
      {
        name: "image content",
        invoke: async (module: CheckModerationModule) =>
          module.checkImageModeration(
            "https://example.com/image.jpg",
            "avatar"
          ),
        expectedContent: {
          type: "image" as const,
          url: "https://example.com/image.jpg",
        },
        expectedContext: "avatar" as const,
      },
      {
        name: "video content",
        invoke: async (module: CheckModerationModule) =>
          module.checkVideoModeration("https://example.com/video.mp4", "cover"),
        expectedContent: {
          type: "video" as const,
          url: "https://example.com/video.mp4",
        },
        expectedContext: "cover" as const,
      },
    ];

    it.each(submissionCases)(
      "submits %s with normalized payload",
      async ({ invoke, expectedContent, expectedContext }) => {
        submitMock.mockResolvedValue(
          createApiResponse({ severity_score: 0.52 })
        );

        const moderationModule = await loadModule();

        const outcome = await invoke(moderationModule);

        expect(submitMock).toHaveBeenCalledWith({
          channel: MODERATION_CHANNEL_NAME,
          content: expectedContent,
        });
        expect(outcome).toEqual({ context: expectedContext, severity: 0.52 });
      }
    );
  });

  describe("severity extraction", () => {
    const severityCases = [
      {
        name: "uses severity_score when available",
        evaluation: { severity_score: 0.73 },
        expectedSeverity: 0.73,
      },
      {
        name: "falls back to flag_probability",
        evaluation: { flag_probability: 0.41 },
        expectedSeverity: 0.41,
      },
      {
        name: "infers severity from flagged boolean",
        evaluation: { flagged: true },
        expectedSeverity: 1,
      },
      {
        name: "returns 0 when evaluation data missing",
        evaluation: undefined,
        expectedSeverity: 0,
      },
    ] as const;

    it.each(severityCases)("%s", async ({ evaluation, expectedSeverity }) => {
      submitMock.mockResolvedValue(createApiResponse(evaluation));

      const moderationModule = await loadModule();

      const outcome = await moderationModule.checkModeration("hello", "post");

      expect(outcome.severity).toBe(expectedSeverity);
    });
  });

  describe("error handling", () => {
    it("wraps provider errors with status, message, and details", async () => {
      const providerError = {
        response: {
          status: 429,
          data: {
            message: "Rate limit exceeded",
            error: { code: "RATE_LIMIT" },
          },
        },
      };

      submitMock.mockRejectedValue(providerError);

      const moderationModule = await loadModule();

      await expect(
        moderationModule.checkModeration("text", "post")
      ).rejects.toMatchObject({
        name: "ModerationProviderError",
        status: 429,
        message: "Rate limit exceeded",
        details: JSON.stringify({ code: "RATE_LIMIT" }),
      });
    });
  });

  describe("decision helpers", () => {
    const decisionCases = [
      {
        name: "moderateText",
        invoke: (module: CheckModerationModule) =>
          module.moderateText("hello", "post"),
        context: "post" as const,
      },
      {
        name: "moderateImage",
        invoke: (module: CheckModerationModule) =>
          module.moderateImage("https://example.com/img.jpg", "avatar"),
        context: "avatar" as const,
      },
      {
        name: "moderateVideo",
        invoke: (module: CheckModerationModule) =>
          module.moderateVideo("https://example.com/video.mp4", "cover"),
        context: "cover" as const,
      },
    ];

    it.each(decisionCases)(
      "delegates to decideModerationAction for %s",
      async ({ invoke, context }) => {
        submitMock.mockResolvedValue(
          createApiResponse({ severity_score: 0.22 })
        );

        const decision: ModerationDecision = {
          context,
          severity: 0.22,
          threshold: 0.5,
          status: "allow",
        };
        decideModerationActionMock.mockReturnValue(decision);

        const moderationModule = await loadModule();

        const result = await invoke(moderationModule);

        expect(decideModerationActionMock).toHaveBeenCalledWith(context, 0.22);
        expect(result).toBe(decision);
      }
    );
  });
});

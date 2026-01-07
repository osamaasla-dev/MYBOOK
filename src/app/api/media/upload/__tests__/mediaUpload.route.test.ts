import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { uploadMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/media/utils/handleMediaUpload", () => ({
  handleMediaUpload: jest.fn(),
}));

jest.mock("@/features/parts/media/utils/errors", () => ({
  isMediaUploadError: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { handleMediaUpload } = jest.requireMock(
  "@/features/parts/media/utils/handleMediaUpload"
) as { handleMediaUpload: jest.Mock };

const { isMediaUploadError } = jest.requireMock(
  "@/features/parts/media/utils/errors"
) as { isMediaUploadError: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer" };

const buildFormData = (includeFile = true) => {
  const formData = new FormData();
  if (includeFile) {
    formData.set(
      "file",
      new File(["mock-content"], "avatar.png", { type: "image/png" })
    );
  }
  formData.set("folder", "profile");
  return formData;
};

const serverFactory = (formData?: FormData) =>
  request(
    createTestServer((req: Request) => {
      Object.defineProperty(req, "formData", {
        value: jest.fn().mockResolvedValue(formData ?? buildFormData()),
      });
      return POST(req);
    })
  );

async function callRoute(formData?: FormData) {
  return serverFactory(formData)
    .post("/api/media/upload")
    .set("content-type", "application/json")
    .send({ trigger: true });
}

describe("/api/media/upload POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-upload",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    handleMediaUpload.mockResolvedValue({ assetId: "asset-1" });
    isMediaUploadError.mockReturnValue(false);
    normalizeError.mockReturnValue({ status: 500, message: "boom" });
  });

  it("returns session response when validation fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-session"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(handleMediaUpload).not.toHaveBeenCalled();
  });

  it("rejects when file missing in form data", async () => {
    const response = await callRoute(buildFormData(false));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("No file provided");
    expect(handleMediaUpload).not.toHaveBeenCalled();
  });

  it("uploads media and returns success payload", async () => {
    handleMediaUpload.mockResolvedValueOnce({ uploadId: "upload-1" });

    const formData = buildFormData();
    const response = await callRoute(formData);

    expect(handleMediaUpload).toHaveBeenCalledWith({
      formData,
      userId: "viewer-1",
      log: expect.any(Object),
      requestId: "req-upload",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { uploadId: "upload-1" },
      message: uploadMessages.success,
    });
  });

  it("returns underlying error response when handleMediaUpload gives error", async () => {
    const failure = apiResponse(false, null, "Invalid media", 422, "req-fail");
    handleMediaUpload.mockResolvedValueOnce({ error: failure });

    const response = await callRoute();

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Invalid media",
    });
  });

  it("handles known media upload errors", async () => {
    const mediaError = {
      statusCode: 413,
      messageKey: "FILE_TOO_LARGE",
      message: "File too large",
    };
    handleMediaUpload.mockRejectedValueOnce(mediaError);
    isMediaUploadError.mockReturnValueOnce(true);

    const response = await callRoute();

    expect(response.status).toBe(413);
    expect(response.body.message).toBe("File too large");
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("Storage down");
    handleMediaUpload.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Media upload failed"
    );
    expect(response.status).toBe(503);
    expect(response.body.message).toBe("service-down");
  });
});

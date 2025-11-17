import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import authMessages from "@/lib/messages/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({
    route: "/api/auth/reset-password/validate",
  });
  try {
    log.info("Validate reset token request received");
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      log.warn({ token }, "Invalid token");
      const res = apiResponse(
        false,
        { valid: false },
        authMessages.password.invalidToken,
        400
      );
      res.headers.set("x-request-id", requestId);
      return res;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
      select: { id: true, password: true },
    });

    if (!user) {
      log.warn({ token }, "Invalid token");
      const res = apiResponse(
        false,
        { valid: false },
        authMessages.password.invalidToken,
        400
      );
      res.headers.set("x-request-id", requestId);
      return res;
    }

    log.info({ userId: user.id }, "Token valid");
    const res = apiResponse(true, { valid: true }, "OK", 200);
    res.headers.set("x-request-id", requestId);
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Validate reset token failed");
    const res = apiResponse(
      false,
      { valid: false },
      error.message ?? authMessages.signup.serverError,
      error.status ?? 500
    );
    res.headers.set("x-request-id", requestId);
    return res;
  }
}

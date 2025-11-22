import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import authMessages from "@/lib/messages/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";
import bcrypt from "bcryptjs";

function isValidPassword(pwd: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
}

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({
    route: "/api/auth/reset-password",
  });
  try {
    log.info("Reset password request received");
    const { token, password, confirmPassword } = (await request.json()) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    if (!token || typeof token !== "string") {
      log.warn({ token }, "Invalid token");
      const res = apiResponse(
        false,
        {},
        authMessages.password.invalidToken,
        400,
        requestId
      );
      return res;
    }

    if (
      !password ||
      !confirmPassword ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      log.warn({ password, confirmPassword }, "Invalid password");
      const res = apiResponse(
        false,
        {},
        authMessages.signup.fieldsRequired,
        400,
        requestId
      );
      return res;
    }

    if (!isValidPassword(password)) {
      log.warn({ password }, "Invalid password");
      const res = apiResponse(
        false,
        {},
        authMessages.signup.invalidPassword,
        400,
        requestId
      );
      return res;
    }

    if (password !== confirmPassword) {
      log.warn({ password, confirmPassword }, "Passwords do not match");
      const res = apiResponse(
        false,
        {},
        authMessages.signup.passwordsMismatch,
        400,
        requestId
      );
      return res;
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      log.warn({ token }, "Invalid token");
      const res = apiResponse(
        false,
        {},
        authMessages.password.invalidToken,
        400,
        requestId
      );
      return res;
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    log.info({ userId: user.id }, "Password reset successful");
    const res = apiResponse(
      true,
      {},
      authMessages.password.resetSuccess,
      200,
      requestId
    );
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Reset password handler failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? authMessages.signup.serverError,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}

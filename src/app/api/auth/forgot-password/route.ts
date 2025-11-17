import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { sendMail } from "@/lib/mail";
import { authMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";
import crypto from "crypto";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({
    route: "/api/auth/forgot-password",
  });
  try {
    log.info("Forgot password request received");
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      log.warn({ email }, "Invalid email");
      const res = apiResponse(
        false,
        {},
        authMessages.signup.fieldsRequired,
        400
      );
      res.headers.set("x-request-id", requestId);
      return res;
    }

    log.info({ email }, "Forgot password request received");

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      try {
        log.info({ userId: user.id }, "Sending password reset email");
        await sendMail({
          to: user.email,
          subject: authMessages.password.resetEmailSubject,
          html: `<p>Click <a href="${resetUrl}" target="_self">here</a> to reset your password. This link expires in 15 minutes.</p>`,
        });
        log.info({ userId: user.id }, "Password reset email enqueued");
      } catch (e) {
        // Do not reveal details to the client to avoid email enumeration
        log.error(
          { err: e, userId: user.id },
          "Password reset email send failed"
        );
      }
    }

    // Always return success message to prevent user enumeration
    log.info({ email }, "Forgot password request processed");
    const res = apiResponse(true, {}, authMessages.password.forgotSent, 200);
    res.headers.set("x-request-id", requestId);
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Forgot password handler failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? authMessages.signup.serverError,
      error.status ?? 500
    );
    res.headers.set("x-request-id", requestId);
    return res;
  }
}

import { signUpSchema } from "@/features/auth/signup/schemas";
import { registerUser } from "@/features/auth/signup/services/server";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { sendMail } from "@/lib/mail";
import { authMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";
import crypto from "crypto";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: "/api/auth/signup" });
  let createdUserId: string | null = null;

  const cleanupUser = async () => {
    if (!createdUserId) return;
    try {
      await prisma.user.delete({ where: { id: createdUserId } });
      log.warn(
        { userId: createdUserId, requestId },
        "Signup rolled back after post-registration failure"
      );
    } catch (cleanupError) {
      log.error(
        { err: cleanupError, userId: createdUserId, requestId },
        "Failed to cleanup user after signup error"
      );
    } finally {
      createdUserId = null;
    }
  };
  try {
    log.info({ requestId }, "Signup request started");
    const body = await request.json();

    // Validate data using the new schema (includes phone)
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      log.info({ requestId }, "Signup request failed");
      const first = parsed.error.issues?.[0];
      const res = apiResponse(
        false,
        {},
        first?.message || authMessages.signup.fieldsRequired,
        400,
        requestId
      );
      return res;
    }

    const { firstName, lastName, birthDate, gender, email, phone, password } =
      parsed.data;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Register user in the database with the token
    log.info({ email }, "Signup request processed");
    const result = await registerUser({
      firstName,
      lastName,
      birthDate,
      gender,
      email,
      phone,
      password,
      verificationToken,
    });

    if (result.error) {
      log.info({ requestId }, "Signup request failed");
      const res = apiResponse(
        false,
        {},
        result.error.message || authMessages.signup.serverError,
        result.error.status ?? 400,
        requestId
      );
      return res;
    }

    createdUserId = result.user.id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    try {
      await sendMail({
        to: result.user.email,
        subject: "Please verify your email",
        html: `<p>Click <a href="${verifyUrl}" target="_self">here</a> to verify your email.</p>`,
      });
      log.info({ userId: result.user.id }, "Verification email enqueued");
    } catch (e) {
      log.error(
        { err: e, userId: result.user.id },
        "Verification email send failed"
      );
      await cleanupUser();
      const res = apiResponse(
        false,
        {},
        "Failed to send verification email. Please try again later.",
        500,
        requestId
      );
      return res;
    }
    log.info({ requestId }, "Signup request completed");
    const res = apiResponse(
      true,
      { user: result.user },
      authMessages.signup.success,
      201,
      requestId
    );
    return res;
  } catch (err) {
    await cleanupUser();
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Signup handler failed");
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

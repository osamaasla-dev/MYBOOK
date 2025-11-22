// app/api/auth/verify-email/route.ts
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { authMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { getRequestLog } from "@/lib/request-log";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({
    route: "/api/auth/verify-email",
  });
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      const res = apiResponse(
        false,
        {},
        authMessages.verify.result.missingToken,
        400,
        requestId
      );
      return res;
    }

    // البحث عن المستخدم اللي عنده التوكن ده
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
      select: { id: true },
    });

    if (!user) {
      const res = apiResponse(
        false,
        {},
        authMessages.verify.result.failed,
        404,
        requestId
      );
      return res;
    }

    // تحديث حالة التحقق وحذف التوكن
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    log.info({ userId: user.id }, "Email verified");
    const res = apiResponse(
      true,
      {},
      authMessages.verify.result.success,
      200,
      requestId
    );
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Verify email handler failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? authMessages.verify.result.failed,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}

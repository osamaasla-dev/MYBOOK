// src/features/parts/postDetails/utils/server/request/parseBody.ts
import { Logger } from "pino";
import { apiResponse } from "@/lib/apiResponse";
import { genericMessages } from "@/lib/messages";
import { ZodSchema } from "zod";
export async function parseRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>, // Zod schema
  log: Logger,
  requestId: string
) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      log.warn({ error: result.error }, "Request body validation failed");
      return {
        error: apiResponse(
          false,
          null,
          genericMessages.invalidParams,
          400,
          requestId
        ),
      };
    }

    return { data: result.data as T };
  } catch (error) {
    log.warn({ error }, "Failed to parse request body");
    return {
      error: apiResponse(
        false,
        null,
        genericMessages.invalidParams,
        400,
        requestId
      ),
    };
  }
}

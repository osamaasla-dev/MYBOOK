import { NextResponse } from "next/server";

export function apiResponse<T>(
  success: boolean,
  data: T,
  message: string,
  status = 200,
  requestId: string
) {
  const res = NextResponse.json(
    {
      success,
      data,
      message,
    },
    { status }
  );
  res.headers.set("x-request-id", requestId);
  return res;
}

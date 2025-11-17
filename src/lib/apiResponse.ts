import { NextResponse } from "next/server";

export function apiResponse<T>(
  success: boolean,
  data: T,
  message: string,
  status = 200
) {
  return NextResponse.json(
    {
      success,
      data,
      message,
    },
    { status }
  );
}

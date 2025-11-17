export type NormalizedError = {
  status?: number;
  code: string;
  message?: string;
};

const toStringCode = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
};

const getString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

/**
 * Normalize various error shapes (AxiosError or custom/plain errors)
 * into a single shape: { status?, code, message? }
 */
export function normalizeError(e: unknown): NormalizedError {
  let status: number | undefined;
  let code: string | undefined;
  let message: string | undefined;

  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;

    // Detect AxiosError via isAxiosError: true
    const isAxios = obj.isAxiosError === true;
    if (isAxios) {
      const response = (obj.response as Record<string, unknown> | undefined) ??
        undefined;
      status = typeof response?.status === "number" ? (response.status as number) : undefined;
      const data =
        response && typeof response.data === "object" && response.data !== null
          ? (response.data as Record<string, unknown>)
          : undefined;

      const codeRaw = toStringCode(data?.code) ?? toStringCode(data?.errorCode);
      code = codeRaw;
      message =
        getString(data?.message) ||
        getString(data?.error) ||
        getString(data?.msg) ||
        getString(obj.message);

      return { status, code: code ?? "", message };
    }

    // Generic object error (e.g., interceptor-shaped)
    status = typeof obj.status === "number" ? (obj.status as number) : undefined;
    const data =
      typeof obj.data === "object" && obj.data !== null
        ? (obj.data as Record<string, unknown>)
        : undefined;
    const codeRaw = toStringCode(data?.code) ?? toStringCode(data?.errorCode);
    code = codeRaw;
    const fromData = getString(data?.message) || getString(data?.error) || getString(data?.msg);
    message = fromData || getString(obj.message);

    return { status, code: code ?? "", message };
  }

  if (typeof e === "string") {
    message = e;
  }

  return { status, code: code ?? "", message };
}

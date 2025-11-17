import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import express from "express";

type AppRouterHandler = (req: Request) => Promise<Response> | Response;
type PagesRouterHandler = (req: unknown, res: ExpressResponse) => unknown;

export function createTestServer(
  handler: AppRouterHandler | PagesRouterHandler,
  options?: { nextAuthPages?: boolean }
) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.all(/.*/, async (req: ExpressRequest, res: ExpressResponse) => {
    const url = `http://localhost${req.originalUrl || req.url}`;

    // ✅ تحويل headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v !== undefined) headers.append(key, String(v));
        }
      } else if (value !== undefined) {
        headers.set(key, String(value));
      }
    }

    // Ensure NextAuth can resolve origin/host
    if (!headers.has("x-forwarded-proto"))
      headers.set("x-forwarded-proto", "http");
    if (!headers.has("x-forwarded-host"))
      headers.set("x-forwarded-host", "localhost:3000");
    if (!headers.has("host")) headers.set("host", "localhost:3000");

    // ✅ تجهيز body
    let requestBody: BodyInit | undefined;
    const contentType = (req.headers["content-type"] || "").toString();
    if (req.body !== undefined && req.body !== null && req.method !== "GET") {
      if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
        requestBody = req.body as BodyInit;
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        try {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(
            req.body as Record<string, unknown>
          )) {
            if (Array.isArray(v)) {
              for (const item of v) params.append(k, String(item));
            } else if (v !== undefined && v !== null) {
              params.append(k, String(v));
            }
          }
          requestBody = params.toString();
        } catch {
          requestBody = undefined;
        }
      } else if (contentType.includes("application/json")) {
        try {
          requestBody = JSON.stringify(req.body);
        } catch {
          requestBody = undefined;
        }
      } else {
        try {
          requestBody = JSON.stringify(req.body);
        } catch {
          requestBody = undefined;
        }
      }
    }

    try {
      if (options?.nextAuthPages) {
        // Pages Router compatibility for NextAuth: build req.query
        const path = req.originalUrl || req.url;
        const after = path.split("/api/auth/")[1] || "";
        const segs = after.split("?")[0].split("/").filter(Boolean);

        // Parse query string (e.g., ?json=true) and merge with nextauth segments
        const u = new URL(url);
        const qsObj: Record<string, string | string[]> = {};
        const seen = new Set<string>();
        for (const key of u.searchParams.keys()) {
          if (seen.has(key)) continue;
          seen.add(key);
          const all = u.searchParams.getAll(key);
          qsObj[key] = all.length > 1 ? all : all[0] ?? "";
        }
        const query = {
          nextauth: segs,
          ...qsObj,
        } as Record<string, unknown>;

        // Build a clean headers object for NextAuth (do not mutate Express req.headers)
        const headersObj: Record<string, string> = Object.fromEntries(
          Object.entries(req.headers).map(([k, v]) => [
            k,
            String(Array.isArray(v) ? v[0] : v ?? ""),
          ])
        );
        // Ensure host headers are present so NextAuth can construct absolute URLs correctly
        if (!headersObj["x-forwarded-proto"])
          headersObj["x-forwarded-proto"] = "http";
        if (!headersObj["x-forwarded-host"])
          headersObj["x-forwarded-host"] = "localhost:3000";
        if (!headersObj["host"]) headersObj["host"] = "localhost:3000";

        // If the client asks for JSON (?json=true), make it explicit to NextAuth
        const jsonParam = new URL(url).searchParams.get("json");
        const wantsJson = jsonParam === "true" || jsonParam === "1";
        if (wantsJson) {
          headersObj["accept"] = "application/json";
          headersObj["x-requested-with"] = "XMLHttpRequest";
          // Also ensure body carries json=true for NextAuth (some handlers rely on body param)
          if (req.method !== "GET") {
            const ct = String(req.headers["content-type"] || "");
            if (
              ct.includes("application/x-www-form-urlencoded") ||
              ct.includes("application/json")
            ) {
              try {
                if (req.body && typeof req.body === "object") {
                  (req.body as Record<string, unknown>)["json"] = "true";
                }
              } catch {
                /* noop */
              }
            }
          }
        }

        // Do NOT force Origin/Referer here. Leaving them unset allows NextAuth
        // to enforce CSRF properly when tokens are missing, matching real-world
        // browser semantics for cross-site requests in tests expecting rejection.

        // Parse cookies from header into an object similar to NextApiRequest.cookies
        const cookiesHeader = String(req.headers["cookie"] || "");
        const cookies: Record<string, string> = {};
        if (cookiesHeader) {
          for (const part of cookiesHeader.split(";")) {
            const idx = part.indexOf("=");
            if (idx === -1) continue;
            const key = decodeURIComponent(part.slice(0, idx).trim());
            const val = decodeURIComponent(part.slice(idx + 1).trim());
            if (key) cookies[key] = val;
          }
        }

        // Create a standalone NextApi-like request object for NextAuth
        const nextApiReq = {
          method: req.method,
          headers: headersObj,
          query,
          cookies,
          body: req.body,
          url,
        } as unknown as Parameters<PagesRouterHandler>[0];

        // Invoke pages-style handler (handler will write to res directly)
        await Promise.resolve((handler as PagesRouterHandler)(nextApiReq, res));
        return;
      }
      // ✅ إنشاء Request (Web Fetch API) for App Router handlers
      const nextReq = new Request(url, {
        method: req.method,
        headers,
        body: requestBody,
      });

      const response = await (handler as AppRouterHandler)(nextReq);

      // ✅ status
      res.status(response.status);

      // ✅ headers
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }

      // ✅ body
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // حاول تشوف لو JSON
      try {
        const json = JSON.parse(buffer.toString("utf-8"));
        res.json(json);
      } catch {
        res.send(buffer);
      }
    } catch (err: unknown) {
      console.error("Handler execution failed:", err);
      res.status(500).json({
        error: "Handler execution failed",
        message: (err as Error)?.message || String(err),
      });
    }
  });

  return app;
}

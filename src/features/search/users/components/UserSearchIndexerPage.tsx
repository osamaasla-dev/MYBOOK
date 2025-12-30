"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

type IndexState =
  | { status: "idle"; message: null; indexed?: number }
  | { status: "running"; message: string; indexed?: number }
  | { status: "success"; message: string; indexed: number }
  | { status: "error"; message: string; indexed?: number };

export function UserSearchIndexerPage() {
  const [state, setState] = useState<IndexState>({
    status: "idle",
    message: null,
  });

  const handleIndex = useCallback(async () => {
    setState({
      status: "running",
      message: "جارٍ رفع المستخدمين إلى Algolia...",
    });

    try {
      const response = await fetch("/api/search/users", {
        method: "POST",
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { indexed?: number };
        message?: string;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "فشل رفع المستخدمين إلى Algolia.");
      }

      const indexed =
        typeof payload.data?.indexed === "number" ? payload.data.indexed : 0;

      setState({
        status: "success",
        message: `تم رفع ${indexed} مستخدم${indexed === 1 ? "" : "ين"} بنجاح.`,
        indexed,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء الرفع.",
      });
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            رفع المستخدمين إلى Algolia
          </h1>
          <p className="text-sm text-muted-foreground">
            استخدم هذا الزر لتحديث فهرس المستخدمين في Algolia بعد تعديل البيانات
            أو إضافة مستخدمين جدد.
          </p>
        </header>

        <div className="mt-6 space-y-4">
          <Button
            type="button"
            onClick={handleIndex}
            disabled={state.status === "running"}
            className="w-full sm:w-auto"
          >
            {state.status === "running"
              ? "جارٍ الرفع..."
              : "رفع المستخدمين الآن"}
          </Button>

          {state.status !== "idle" ? (
            <p
              className={`text-sm ${
                state.status === "error"
                  ? "text-destructive"
                  : state.status === "success"
                  ? "text-emerald-600"
                  : "text-muted-foreground"
              }`}
            >
              {state.message}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              آخر حالة: لم يتم تنفيذ أي رفع بعد في هذه الجلسة.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

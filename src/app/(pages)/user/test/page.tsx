"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui";
import { useModerationCheck } from "@/features/hooks";
import { decideModerationAction } from "@/features/parts/moderation/constants/moderationThresholds";
import type { ModerationContext } from "@/features/types";

export default function UserTestModerationPage() {
  const [content, setContent] = useState("");
  const [context, setContext] = useState<ModerationContext>("post");
  const moderationMutation = useModerationCheck();

  const moderationData = moderationMutation.data;
  const decision = moderationData
    ? decideModerationAction(moderationData.context, moderationData.severity)
    : null;
  const action = decision?.status ?? "allow";
  const actionLabel: Record<typeof action, string> = {
    reject: "مرفوض",
    allow: "مقبول",
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    moderationMutation.mutate({ content, context });
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Moderation Hook Playground</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          السياق
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={context}
            onChange={(event) =>
              setContext(event.target.value as ModerationContext)
            }
          >
            <option value="post">منشور</option>
            <option value="comment">تعليق</option>
            <option value="message">رسالة خاصة</option>
          </select>
        </label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="اكتب نص للتجربة"
          rows={6}
        />
        <Button type="submit" disabled={moderationMutation.isPending}>
          {moderationMutation.isPending ? "جارٍ المراجعة..." : "أرسل للمراجعة"}
        </Button>
      </form>

      {moderationMutation.isSuccess && moderationData && decision ? (
        <section className="rounded border p-4 text-sm">
          <div>
            <p className="font-semibold">النتيجة: {actionLabel[action]}</p>
            <p className="text-xs text-muted-foreground">
              المؤشر الحالي: {moderationData.severity.toFixed(2)} / قيمة الحد:{" "}
              {decision.threshold}
            </p>
            <p className="text-xs text-muted-foreground">
              السياق الحالي: {decision.context}
            </p>
          </div>

          <pre className="mt-3 overflow-auto text-wrap break-all">
            {JSON.stringify(moderationData, null, 2)}
          </pre>
        </section>
      ) : null}

      {moderationMutation.isError ? (
        <p className="text-sm text-red-600">
          {moderationMutation.error.message}
        </p>
      ) : null}
    </main>
  );
}

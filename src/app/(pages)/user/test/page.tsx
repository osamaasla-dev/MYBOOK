"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui";
import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import { decideModerationAction } from "@/features/parts/moderation/constants/moderationThresholds";
import type { ModerationContext } from "@/features/types";
import { useModerationCheck } from "@/features/parts/moderation/hooks/useModerationCheck";

export default function UserTestModerationPage() {
  const [content, setContent] = useState("");
  const [context, setContext] = useState<ModerationContext>("post");
  const [imageContext, setImageContext] = useState<ModerationContext>("post");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const moderationMutation = useModerationCheck();
  const mediaUploadMutation = useMediaUpload();

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

  const handleImageUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFile) return;
    mediaUploadMutation.mutate({
      file: imageFile,
      folderType: "test",
      resourceType: "image",
      context: imageContext,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
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

      <section className="rounded border p-4">
        <h2 className="mb-3 text-lg font-semibold">تجربة رفع صورة</h2>
        <form onSubmit={handleImageUpload} className="space-y-3">
          <label className="block text-sm font-medium">
            سياق الموديريشن للصورة
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={imageContext}
              onChange={(event) =>
                setImageContext(event.target.value as ModerationContext)
              }
            >
              <option value="post">منشور</option>
              <option value="comment">تعليق</option>
              <option value="message">رسالة خاصة</option>
            </select>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm"
          />
          <Button
            type="submit"
            disabled={!imageFile || mediaUploadMutation.isPending}
          >
            {mediaUploadMutation.isPending ? "جارٍ الرفع..." : "ارفع الصورة"}
          </Button>
        </form>

        {mediaUploadMutation.isSuccess && mediaUploadMutation.data ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-medium">
              {mediaUploadMutation.data.moderationStatus === "allow"
                ? "تم قبول الصورة بعد الموديريشن ✅"
                : "تم رفض الصورة بعد الموديريشن ❌"}
            </p>
            <p className="text-xs text-muted-foreground">
              شدة المؤشر:{" "}
              {mediaUploadMutation.data.moderationSeverity.toFixed(2)} / حد
              السياق: {mediaUploadMutation.data.moderationThreshold} (
              {mediaUploadMutation.data.moderationContext})
            </p>
            {mediaUploadMutation.data.asset ? (
              <img
                src={mediaUploadMutation.data.asset.url}
                alt="Uploaded preview"
                className="max-h-48 rounded border object-contain"
              />
            ) : null}
            <pre className="overflow-auto text-wrap break-all">
              {JSON.stringify(mediaUploadMutation.data, null, 2)}
            </pre>
          </div>
        ) : null}

        {mediaUploadMutation.isError ? (
          <p className="mt-2 text-sm text-red-600">
            {mediaUploadMutation.error.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}

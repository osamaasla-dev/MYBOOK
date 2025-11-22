import { Loader2 } from "lucide-react";
import React from "react";

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-strong/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 bg-primary-light rounded-xl shadow-lg">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="text-primary-dark font-semibold text-lg">{text}</span>
      </div>
    </div>
  );
}

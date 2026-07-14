"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/stitch/material-icon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-[var(--spacing-margin-mobile)]">
      <div className="w-full max-w-md rounded-[2rem] border border-surface-container-highest bg-surface-container-lowest p-8 text-center cloud-shadow">
        <MaterialIcon name="error" className="mb-4 text-[48px] text-secondary" />
        <h1 className="font-headline-md-mobile text-on-background">页面出错了</h1>
        <p className="mt-3 font-body-md text-on-surface-variant">
          {error.message || "服务器遇到意外错误，请稍后重试。"}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="font-label-caps min-h-touch-target-min rounded-full bg-primary py-3 text-on-primary cloud-shadow transition hover:opacity-90"
          >
            重试
          </button>
          <Link href="/login" className="font-label-caps text-primary hover:underline">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}

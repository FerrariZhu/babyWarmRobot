"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/stitch/material-icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo_user_1@baby-outfit.dev");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const configError = new URLSearchParams(window.location.search).get("error");
    if (configError) setError(configError);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-[var(--spacing-margin-mobile)]">
      <div className="w-full max-w-md rounded-[2rem] border border-surface-container-highest bg-surface-container-lowest p-8 shadow-cloud">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <MaterialIcon name="child_care" className="text-[32px]" filled />
          </div>
          <h1 className="font-display-lg-mobile text-primary">LittleCompass</h1>
          <p className="mt-2 font-body-md text-on-surface-variant">登录后查看今日穿搭推荐</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-label-caps text-on-surface-variant">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body-md w-full rounded-xl border-2 border-surface-container-high bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-label-caps text-on-surface-variant"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-body-md w-full rounded-xl border-2 border-surface-container-high bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-secondary-fixed px-3 py-2 font-body-md text-on-secondary-fixed">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-label-caps w-full rounded-full bg-primary py-3 text-on-primary transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="mt-6 text-center font-body-md text-sm text-on-surface-variant">
          Demo：demo_user_1@baby-outfit.dev / password123
        </p>
      </div>
    </div>
  );
}

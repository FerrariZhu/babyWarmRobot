"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/stitch/material-icon";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-high py-3 font-label-caps text-on-surface-variant transition hover:bg-surface-container-highest"
    >
      <MaterialIcon name="logout" className="text-[18px]" />
      退出登录
    </button>
  );
}

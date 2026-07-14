export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "缺少 Supabase 环境变量。本地请在 web/.env.local 配置；Netlify 请在 Site configuration → Environment variables 添加 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY，然后重新部署。"
    );
  }

  return { url, key };
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { DbBaby } from "@/lib/db/types";
import { MaterialIcon } from "@/components/stitch/material-icon";

export function EditBabyForm({ baby }: { baby: DbBaby }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(baby.name);
  const [birthDate, setBirthDate] = useState(baby.birth_date);
  const [heightCm, setHeightCm] = useState(
    baby.height_cm != null ? String(Math.round(Number(baby.height_cm))) : ""
  );
  const [weightKg, setWeightKg] = useState(
    baby.weight_kg != null ? String(Number(baby.weight_kg)) : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(baby.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("请输入宝宝名字");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/babies/${baby.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birth_date: birthDate,
          height_cm: heightCm ? Number(heightCm) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          avatar_url: avatarUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="mb-10 space-y-2 text-center">
        <h2 className="font-headline-md text-[28px] leading-tight text-on-background">编辑成长档案</h2>
        <p className="font-body-md text-outline">随时更新 {baby.name} 的成长里程碑。</p>
      </div>

      <div className="mb-12 flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative cursor-pointer"
        >
          <div className="flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-surface-container-lowest p-2 shadow-[0_8px_32px_rgba(62,102,88,0.08)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 md:h-40 md:w-40">
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-surface-container-high shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-70"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-container text-3xl font-semibold text-on-primary-container">
                  {name[0] ?? "宝"}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <MaterialIcon name="photo_camera" filled className="text-[36px] text-white drop-shadow-md" />
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 z-10 flex h-12 w-12 translate-x-2 translate-y-2 items-center justify-center rounded-full border-[3px] border-background bg-primary text-on-primary shadow-[0_4px_16px_rgba(62,102,88,0.2)] transition-transform duration-300 group-hover:rotate-12">
            <MaterialIcon name="edit" filled className="text-[22px]" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(62,102,88,0.03)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <label className="font-label-caps mb-1.5 block uppercase tracking-wider text-outline" htmlFor="baby_name">
              名字
            </label>
            <input
              id="baby_name"
              className="font-body-lg w-full border-none bg-transparent p-0 text-on-background outline-none placeholder:text-outline-variant focus:ring-0"
              placeholder="输入宝宝的名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex cursor-pointer items-center justify-between rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(62,102,88,0.03)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <div className="flex-1">
              <label className="font-label-caps mb-1.5 block uppercase tracking-wider text-outline" htmlFor="baby_dob">
                生日
              </label>
              <input
                id="baby_dob"
                type="date"
                className="font-body-lg w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-on-background outline-none focus:ring-0"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary">
              <MaterialIcon name="calendar_today" className="text-[20px]" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:gap-6">
          <div className="group relative overflow-hidden rounded-3xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_16px_rgba(62,102,88,0.04)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-bl-full bg-primary-container/30 transition-transform group-hover:scale-110" />
            <label className="font-label-caps relative z-10 mb-2 block uppercase tracking-wider text-outline" htmlFor="baby_height">
              身高
            </label>
            <div className="relative z-10 flex items-baseline space-x-1">
              <input
                id="baby_height"
                type="number"
                min={0}
                className="font-display-lg w-full border-none bg-transparent p-0 text-[32px] font-bold text-primary outline-none placeholder:text-primary/30 focus:ring-0"
                placeholder="00"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
              <span className="font-body-md font-medium text-outline">cm</span>
            </div>
            <MaterialIcon name="straighten" className="pointer-events-none absolute right-4 bottom-4 text-[24px] text-outline-variant opacity-50" />
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_16px_rgba(62,102,88,0.04)] transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-bl-full bg-secondary-container/30 transition-transform group-hover:scale-110" />
            <label className="font-label-caps relative z-10 mb-2 block uppercase tracking-wider text-outline" htmlFor="baby_weight">
              体重
            </label>
            <div className="relative z-10 flex items-baseline space-x-1">
              <input
                id="baby_weight"
                type="number"
                min={0}
                step={0.1}
                className="font-display-lg w-full border-none bg-transparent p-0 text-[32px] font-bold text-secondary outline-none placeholder:text-secondary/30 focus:ring-0"
                placeholder="0.0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              <span className="font-body-md font-medium text-outline">kg</span>
            </div>
            <MaterialIcon name="scale" className="pointer-events-none absolute right-4 bottom-4 text-[24px] text-outline-variant opacity-50" />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-secondary-fixed px-4 py-3 font-body-md text-on-secondary-fixed">{error}</p>
        )}

        <div className="sticky bottom-0 z-20 mt-12 space-y-4 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6 md:relative md:bg-none md:pt-0 md:pb-0">
          <button
            type="submit"
            disabled={saving}
            className="font-headline-md flex min-h-[56px] w-full items-center justify-center rounded-full bg-primary text-[18px] text-on-primary shadow-[0_8px_24px_rgba(62,102,88,0.25)] transition-all hover:-translate-y-0.5 hover:bg-surface-tint hover:shadow-[0_12px_32px_rgba(62,102,88,0.3)] active:translate-y-0 active:scale-[0.98] active:shadow-md disabled:opacity-60"
          >
            {saving ? "保存中…" : "保存档案"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="font-headline-md flex min-h-[56px] w-full items-center justify-center rounded-full bg-transparent text-[18px] text-on-surface-variant transition-all hover:bg-surface-container-high active:scale-[0.98]"
          >
            取消
          </button>
        </div>
      </form>
    </>
  );
}

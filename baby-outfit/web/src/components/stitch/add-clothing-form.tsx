"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbCategory, DbMaterial, DbSizeLabel, DbThickness } from "@/lib/db/types";
import { togEquivalent } from "@/lib/clothing-display";
import { MaterialIcon } from "@/components/stitch/material-icon";

const MATERIAL_PRESETS = ["全棉", "竹纤维", "抓绒"];

export function AddClothingForm({
  materials,
  sizes,
  categories,
  thicknesses,
  babyId,
}: {
  materials: DbMaterial[];
  sizes: DbSizeLabel[];
  categories: DbCategory[];
  thicknesses: DbThickness[];
  babyId?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultThickness = thicknesses[0]?.code ?? "medium";
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [thickness, setThickness] = useState<string>(defaultThickness);
  const [weightGrams, setWeightGrams] = useState("");
  const [materialTags, setMaterialTags] = useState("");
  const [warmthPreview, setWarmthPreview] = useState<number | null>(null);
  const [warmthPreviewLoading, setWarmthPreviewLoading] = useState(false);
  const [warmthPreviewError, setWarmthPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!category && categories[0]?.code) {
      setCategory(categories[0].code);
    }
  }, [categories, category]);

  useEffect(() => {
    if (thicknesses.length > 0 && !thicknesses.some((t) => t.code === thickness)) {
      setThickness(thicknesses[0].code);
    }
  }, [thicknesses, thickness]);

  const selectedMaterialName = useMemo(
    () => materials.find((m) => m.id === materialId)?.name ?? "",
    [materialId, materials]
  );

  const refreshWarmthPreview = useCallback(
    async (next: {
      category?: string;
      materialId?: string;
      thickness?: string;
      weightGrams?: string;
    } = {}) => {
      const cat = next.category ?? category;
      const mat = next.materialId ?? materialId;
      const thick = next.thickness ?? thickness;
      const weight = next.weightGrams ?? weightGrams;
      if (!cat || !mat || !thick) {
        setWarmthPreview(null);
        setWarmthPreviewError(null);
        return;
      }

      setWarmthPreviewLoading(true);
      setWarmthPreviewError(null);
      try {
        const res = await fetch("/api/clothing/preview-warmth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: cat,
            material_id: mat,
            thickness: thick,
            weight_grams: weight ? Number(weight) : null,
          }),
        });
        const data = (await res.json()) as { warmth_score?: number; error?: string };
        if (!res.ok) {
          setWarmthPreview(null);
          setWarmthPreviewError(data.error ?? "无法计算保暖值");
          return;
        }
        setWarmthPreview(data.warmth_score ?? null);
      } catch {
        setWarmthPreview(null);
        setWarmthPreviewError("无法计算保暖值");
      } finally {
        setWarmthPreviewLoading(false);
      }
    },
    [category, materialId, thickness, weightGrams]
  );

  useEffect(() => {
    void refreshWarmthPreview();
  }, [refreshWarmthPreview]);

  async function handleParseUrl() {
    if (!url.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/clothing/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解析失败");
      if (data.name) setName(data.name);
      if (data.category) setCategory(data.category);
      if (data.material_id) setMaterialId(data.material_id);
      await refreshWarmthPreview({
        category: data.category ?? category,
        materialId: data.material_id ?? materialId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category || !materialId) {
      setError("请填写名称、类别和材质。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          material_id: materialId,
          thickness,
          size_label: sizeLabel || null,
          weight_grams: weightGrams ? Number(weightGrams) : null,
          baby_id: babyId ?? null,
          notes: materialTags.trim() || null,
          source_url: url.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      router.push(`/add/success?id=${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function appendMaterialTag(tag: string) {
    const parts = materialTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.includes(tag)) parts.push(tag);
    setMaterialTags(parts.join(", "));
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-md-mobile text-on-background">快速添加</h2>
        <div className="flex flex-col gap-4 rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 cloud-shadow">
          <p className="font-body-md text-on-surface-variant">
            粘贴主流婴儿服装零售商的链接，自动导入详细信息。
          </p>
          <div className="flex flex-col gap-4">
            <input
              className="font-body-md min-h-touch-target-min w-full rounded-full border border-surface-container-high bg-surface-bright px-6 text-on-background input-sunken transition-colors outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="https://store.com/item..."
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={handleParseUrl}
              disabled={parsing}
              className="font-label-caps flex min-h-touch-target-min w-full items-center justify-center gap-2 rounded-full bg-secondary px-8 tracking-wider text-on-secondary uppercase shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {parsing ? (
                <>
                  <MaterialIcon name="sync" className="animate-spin" />
                  正在解析...
                </>
              ) : (
                <>
                  <MaterialIcon name="auto_awesome" filled />
                  解析链接
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-surface-container-high" />
        <span className="font-label-caps text-outline-variant">或</span>
        <div className="h-px flex-1 bg-surface-container-high" />
      </div>

      <section className="mb-8 flex flex-col gap-4">
        <h2 className="font-headline-md-mobile text-on-background">手动录入</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <FieldSelect
              label="类别"
              value={category}
              onChange={(v) => {
                setCategory(v);
                void refreshWarmthPreview({ category: v });
              }}
              placeholder="选择类别..."
              options={categories.map((o) => ({ value: o.code, label: o.label }))}
            />
            <FieldSelect
              label="尺码"
              value={sizeLabel}
              onChange={setSizeLabel}
              placeholder="选择尺码..."
              options={sizes.map((s) => ({ value: s.code, label: s.label }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps ml-2 text-on-surface-variant">名称</label>
            <input
              className="font-body-md min-h-touch-target-min w-full rounded-full border border-surface-container-high bg-surface-container-lowest px-6 text-on-background input-sunken outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="有机棉连身衣"
              required
            />
          </div>

          <FieldSelect
            label="材质"
            value={materialId}
            onChange={(v) => {
              setMaterialId(v);
              const mat = materials.find((m) => m.id === v);
              if (mat) setMaterialTags(mat.name);
              void refreshWarmthPreview({ materialId: v });
            }}
            placeholder="选择材质..."
            options={materials.map((m) => ({ value: m.id, label: m.name }))}
          />

          <FieldSelect
            label="厚度"
            value={thickness}
            onChange={(v) => {
              setThickness(v);
              void refreshWarmthPreview({ thickness: v });
            }}
            placeholder="选择厚度..."
            options={thicknesses.map((o) => ({ value: o.code, label: o.label }))}
          />

          <div className="flex flex-col gap-2">
            <label className="font-label-caps ml-2 text-on-surface-variant">材质标签</label>
            <input
              className="font-body-md min-h-touch-target-min w-full rounded-full border border-surface-container-high bg-surface-container-lowest px-6 text-on-background input-sunken outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="例如：100%全棉, 美利奴羊毛..."
              type="text"
              value={materialTags}
              onChange={(e) => setMaterialTags(e.target.value)}
            />
            <div className="mt-2 ml-2 flex flex-wrap gap-2">
              {MATERIAL_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendMaterialTag(tag)}
                  className="font-label-caps rounded-full bg-surface-container-high px-3 py-1 text-[10px] uppercase text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  + {tag}
                </button>
              ))}
              {selectedMaterialName && (
                <span className="font-label-caps rounded-full bg-primary-fixed px-3 py-1 text-[10px] text-on-primary-fixed">
                  {selectedMaterialName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps ml-2 text-on-surface-variant">重量 (克)</label>
            <div className="relative flex items-center">
              <input
                className="font-body-md min-h-touch-target-min w-full rounded-full border border-surface-container-high bg-surface-container-lowest px-6 pr-16 text-on-background input-sunken outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0"
                type="number"
                min={0}
                value={weightGrams}
                onChange={(e) => {
                  setWeightGrams(e.target.value);
                  void refreshWarmthPreview({ weightGrams: e.target.value });
                }}
              />
              <span className="font-body-md absolute right-6 text-outline">g</span>
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between rounded-xl border border-primary-fixed-dim bg-primary-container p-5 transition-all duration-300 ${warmthPreview !== null ? "scale-[1.02]" : ""}`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-label-caps uppercase text-on-primary-container">预测保暖值</span>
              <div className="flex items-end gap-2">
                <span className="font-data-heavy text-3xl text-on-primary-container">
                  {warmthPreviewLoading
                    ? "…"
                    : warmthPreview !== null
                      ? togEquivalent(warmthPreview)
                      : "—"}
                </span>
                <span className="font-label-caps mb-1 opacity-80 text-on-primary-container">
                  TOG 等效值
                </span>
              </div>
              {warmthPreview !== null && !warmthPreviewLoading && (
                <span className="font-label-caps text-[10px] opacity-70 text-on-primary-container">
                  保暖指数 {Math.round(warmthPreview)}
                </span>
              )}
              {warmthPreviewError && (
                <span className="font-body-md text-[12px] text-on-secondary-fixed">{warmthPreviewError}</span>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <MaterialIcon name="thermostat" filled className="text-on-primary" />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-secondary-fixed px-4 py-3 font-body-md text-on-secondary-fixed">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="font-label-caps mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-primary tracking-wider text-on-primary uppercase shadow-md transition-all hover:opacity-90 active:translate-y-1 disabled:opacity-60"
          >
            <MaterialIcon name="add" />
            {saving ? "保存中…" : "保存至衣柜"}
          </button>
        </form>
      </section>
    </>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-caps ml-2 text-on-surface-variant">{label}</label>
      <div className="relative">
        <select
          className="font-body-md min-h-touch-target-min w-full appearance-none rounded-full border border-surface-container-high bg-surface-container-lowest px-6 pr-12 text-on-background input-sunken outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <MaterialIcon
          name="expand_more"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-outline"
        />
      </div>
    </div>
  );
}

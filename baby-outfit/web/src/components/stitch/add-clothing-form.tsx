"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClothingCategory } from "@baby-outfit/core";
import type { DbMaterial, DbSizeLabel, DbThickness } from "@/lib/db/types";
import { getCategoryLabel, normalizeCategoryCode } from "@/lib/clothing-categories";
import { FIT_TYPE_OPTIONS, type ClothingFitType } from "@/lib/clothing-weight";
import { togEquivalent } from "@/lib/clothing-display";
import { MaterialIcon } from "@/components/stitch/material-icon";
import { OptionChips } from "@/components/stitch/option-chips";

type ParseApiData = {
  error?: string;
  job_id?: string | null;
  name?: string;
  category?: string;
  material_id?: string;
  thickness?: string;
  size_label?: string | null;
  material_hint?: string | null;
  warnings?: string[];
  price_text?: string | null;
  image_url?: string | null;
  canonical_url?: string | null;
  platform?: string | null;
  item_id?: string | null;
};

export function AddClothingForm({
  materials,
  sizes,
  thicknesses,
  babyId,
  initialCategory = null,
}: {
  materials: DbMaterial[];
  sizes: DbSizeLabel[];
  thicknesses: DbThickness[];
  babyId?: string;
  initialCategory?: ClothingCategory | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultThickness = thicknesses[0]?.code ?? "medium";
  const [name, setName] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [sizeLabel, setSizeLabel] = useState("");
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [thickness, setThickness] = useState<string>(defaultThickness);
  const [fitType, setFitType] = useState<ClothingFitType>("regular");
  const [estimatedWeightGrams, setEstimatedWeightGrams] = useState<number | null>(null);
  const [warmthPreview, setWarmthPreview] = useState<number | null>(null);
  const [warmthPreviewLoading, setWarmthPreviewLoading] = useState(false);
  const [warmthPreviewError, setWarmthPreviewError] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [parseJobId, setParseJobId] = useState<string | null>(null);
  const [canonicalSourceUrl, setCanonicalSourceUrl] = useState<string | null>(null);
  const [parseMetadata, setParseMetadata] = useState<Record<string, unknown> | null>(
    null
  );
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (thicknesses.length > 0 && !thicknesses.some((t) => t.code === thickness)) {
      setThickness(thicknesses[0].code);
    }
  }, [thicknesses, thickness]);

  const refreshWarmthPreview = useCallback(
    async (next: {
      category?: string;
      materialId?: string;
      thickness?: string;
      sizeLabel?: string;
      fitType?: ClothingFitType;
    } = {}) => {
      const cat = next.category ?? category;
      const mat = next.materialId ?? materialId;
      const thick = next.thickness ?? thickness;
      const size = next.sizeLabel ?? sizeLabel;
      const fit = next.fitType ?? fitType;
      if (!cat || !mat || !thick) {
        setWarmthPreview(null);
        setEstimatedWeightGrams(null);
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
            size_label: size || null,
            fit_type: fit,
          }),
        });
        const data = (await res.json()) as {
          warmth_score?: number;
          weight_grams?: number | null;
          error?: string;
        };
        if (!res.ok) {
          setWarmthPreview(null);
          setEstimatedWeightGrams(null);
          setWarmthPreviewError(data.error ?? "无法计算保暖值");
          return;
        }
        setWarmthPreview(data.warmth_score ?? null);
        setEstimatedWeightGrams(data.weight_grams ?? null);
      } catch {
        setWarmthPreview(null);
        setEstimatedWeightGrams(null);
        setWarmthPreviewError("无法计算保暖值");
      } finally {
        setWarmthPreviewLoading(false);
      }
    },
    [category, materialId, thickness, sizeLabel, fitType]
  );

  useEffect(() => {
    void refreshWarmthPreview();
  }, [refreshWarmthPreview]);

  const applyParseData = useCallback(
    async (data: ParseApiData) => {
      const nextCategory = data.category ?? category;
      const nextMaterialId = data.material_id ?? materialId;
      const nextThickness = data.thickness ?? thickness;

      if (data.job_id) setParseJobId(data.job_id);
      if (data.canonical_url) setCanonicalSourceUrl(data.canonical_url);
      setParseMetadata({
        platform: data.platform,
        item_id: data.item_id,
        price_text: data.price_text,
        warnings: data.warnings,
        parsed_at: new Date().toISOString(),
      });

      if (data.name) setName(data.name);
      if (data.category) {
        const normalized = normalizeCategoryCode(data.category);
        if (normalized) setCategory(normalized);
      }
      if (data.material_id) setMaterialId(data.material_id);
      if (data.thickness) setThickness(data.thickness);
      if (data.size_label) {
        const matched =
          sizes.find((s) => s.code === data.size_label || s.label === data.size_label) ??
          sizes.find((s) => data.size_label?.includes(s.code));
        setSizeLabel(matched?.code ?? data.size_label);
      }
      if (data.image_url) setImageUrl(data.image_url);

      const warnings = data.warnings ?? [];
      const priceNote = data.price_text ? `参考价 ${data.price_text}` : null;
      const notice = [...warnings, priceNote].filter(Boolean).join(" ");
      setParseNotice(
        notice ||
          (data.name
            ? "已导入商品信息；解析记录已写入数据库，点「保存至衣柜」后才会加入衣柜。"
            : null)
      );

      await refreshWarmthPreview({
        category: nextCategory,
        materialId: nextMaterialId,
        thickness: nextThickness,
        sizeLabel: data.size_label ?? sizeLabel,
      });
    },
    [category, materialId, thickness, sizeLabel, sizes, refreshWarmthPreview]
  );

  async function handleParseUrl() {
    if (!url.trim()) return;
    setParsing(true);
    setError(null);
    setParseNotice(null);
    try {
      const res = await fetch("/api/clothing/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: url.trim() }),
      });
      const data = (await res.json()) as ParseApiData;
      if (!res.ok) throw new Error(data.error ?? "解析失败");
      await applyParseData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setParsing(false);
    }
  }

  async function handleScreenshotChange(file: File | null) {
    if (!file) return;
    setParsing(true);
    setError(null);
    setParseNotice(null);

    const preview = URL.createObjectURL(file);
    setScreenshotPreview(preview);

    try {
      const form = new FormData();
      form.append("image", file);
      if (url.trim()) form.append("source_url", url.trim());

      const res = await fetch("/api/clothing/parse-image", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ParseApiData;
      if (!res.ok) throw new Error(data.error ?? "截图识别失败");
      await applyParseData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "截图识别失败");
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
          fit_type: fitType,
          weight_grams: estimatedWeightGrams,
          baby_id: babyId ?? null,
          source_url: canonicalSourceUrl ?? (url.trim() || null),
          image_url: imageUrl,
          source_metadata: parseMetadata ?? undefined,
          parse_job_id: parseJobId ?? undefined,
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

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-md-mobile text-on-background">快速添加</h2>
        <div className="flex flex-col gap-4 rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 cloud-shadow">
          <p className="font-body-md text-on-surface-variant">
            已支持万邦商品 API：粘贴淘宝/天猫链接即可解析。也可粘贴带「商品名」的分享文案，或上传商品页截图（需
            OPENAI_API_KEY）。
          </p>
          <div className="flex flex-col gap-4">
            <textarea
              className="font-body-md min-h-[88px] w-full resize-y rounded-2xl border border-surface-container-high bg-surface-bright px-6 py-4 text-on-background input-sunken transition-colors outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="粘贴链接，或淘宝分享整段文案（推荐，可带上商品名）"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={3}
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

            <div className="flex flex-col gap-3 border-t border-surface-container-high pt-4">
              <p className="font-label-caps text-on-surface-variant">或上传商品页截图</p>
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void handleScreenshotChange(file);
                  e.target.value = "";
                }}
              />
              {screenshotPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotPreview}
                  alt="商品页截图预览"
                  className="max-h-40 w-full rounded-xl object-contain bg-surface-container-low"
                />
              )}
              <button
                type="button"
                disabled={parsing}
                onClick={() => screenshotInputRef.current?.click()}
                className="font-label-caps flex min-h-touch-target-min w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-surface-container-lowest px-8 text-primary transition-all hover:bg-primary-fixed active:scale-95 disabled:opacity-60"
              >
                <MaterialIcon name="photo_camera" />
                {parsing ? "识别中…" : "从截图识别衣物信息"}
              </button>
            </div>

            {parseNotice && (
              <p className="rounded-xl bg-primary-fixed px-4 py-3 font-body-md text-on-primary-fixed">
                {parseNotice}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-surface-container-high" />
        <span className="font-label-caps text-outline-variant">或</span>
        <div className="h-px flex-1 bg-surface-container-high" />
      </div>

      <section className="flex flex-col gap-4 pb-4">
        <h2 className="font-headline-md-mobile text-on-background">手动录入</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps ml-2 text-on-surface-variant">衣服名称</label>
              <input
                className="font-body-md min-h-touch-target-min w-full rounded-full border border-surface-container-high bg-surface-container-lowest px-6 text-on-background input-sunken outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="商品标题"
                required
              />
            </div>

            <CategoryFieldLink value={category} />

            <FieldSelect
              label="尺码"
              value={sizeLabel}
              onChange={(v) => {
                setSizeLabel(v);
                void refreshWarmthPreview({ sizeLabel: v });
              }}
              placeholder="选择尺码..."
              options={sizes.map((s) => ({ value: s.code, label: s.label }))}
            />

            <FieldSelect
              label="材质"
              value={materialId}
              onChange={(v) => {
                setMaterialId(v);
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

            <OptionChips<ClothingFitType>
              label="版型"
              value={fitType}
              options={FIT_TYPE_OPTIONS}
              onChange={(v) => {
                setFitType(v);
                void refreshWarmthPreview({ fitType: v });
              }}
            />
          </div>

          <div
            className={`flex items-center justify-between rounded-xl border border-primary-fixed-dim bg-primary-container p-5 transition-all duration-300 ${warmthPreview !== null ? "scale-[1.02]" : ""}`}
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
              {estimatedWeightGrams != null && !warmthPreviewLoading && (
                <span className="font-label-caps text-[10px] opacity-70 text-on-primary-container">
                  估算重量约 {estimatedWeightGrams} g
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

          <div className="h-24 md:hidden" aria-hidden />

          <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-md px-margin-mobile md:static md:inset-auto md:mt-6 md:px-0">
            <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-2 md:bg-none md:p-0">
              <button
                type="submit"
                disabled={saving}
                className="font-label-caps flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-primary tracking-wider text-on-primary uppercase shadow-[0_8px_24px_rgba(62,102,88,0.25)] transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
              >
                <MaterialIcon name="add" />
                {saving ? "保存中…" : "保存至衣柜"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

function CategoryFieldLink({ value }: { value: string }) {
  const label = value ? getCategoryLabel(value) : null;
  const href = value
    ? `/add/category?current=${encodeURIComponent(value)}`
    : "/add/category";

  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-caps ml-2 text-on-surface-variant">类别</label>
      <Link
        href={href}
        className="font-body-md flex min-h-touch-target-min w-full items-center justify-between rounded-full border border-surface-container-high bg-surface-container-lowest px-6 text-on-background input-sunken transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
      >
        <span className={label ? "" : "text-outline"}>{label ?? "选择类别..."}</span>
        <MaterialIcon name="chevron_right" className="text-outline" />
      </Link>
    </div>
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DbClothingItem } from "@/lib/db/types";
import {
  WARDROBE_FILTERS,
  matchesWardrobeFilter,
  seasonBadgeClass,
  seasonBadgeLabel,
  warmthIndexLabel,
  type WardrobeFilter,
} from "@/lib/clothing-display";
import { MaterialIcon } from "@/components/stitch/material-icon";

export function WardrobeView({ items }: { items: DbClothingItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WardrobeFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesWardrobeFilter(item.category, filter)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.size_label ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="relative w-full">
          <MaterialIcon
            name="search"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-outline"
          />
          <input
            className="font-body-lg h-14 w-full rounded-full border-2 border-surface-container-high bg-surface-container-lowest pr-4 pl-12 text-on-surface input-sunken transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-0 focus:outline-none"
            placeholder="搜索衣柜..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
          />
        </div>
        <div className="-mx-margin-mobile scrollbar-hide flex snap-x gap-2 overflow-x-auto px-margin-mobile pb-2">
          {WARDROBE_FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={
                filter === chip.id
                  ? "snap-start shrink-0 rounded-full bg-primary px-6 py-2 font-label-caps whitespace-nowrap text-on-primary transition-transform active:scale-95"
                  : "snap-start shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-6 py-2 font-label-caps whitespace-nowrap text-on-surface-variant cloud-shadow transition-all hover:bg-surface-container-low active:scale-95"
              }
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {filtered.length > 0 ? (
        <section className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <WardrobeCard key={item.id} item={item} />
          ))}
        </section>
      ) : (
        <section className="rounded-xl bg-surface-container-lowest p-8 text-center cloud-shadow">
          <MaterialIcon name="checkroom" className="mb-3 text-[48px] text-primary/30" />
          <p className="font-body-md text-on-surface-variant">没有匹配的衣物。</p>
        </section>
      )}

      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/50 bg-surface-container-low p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <MaterialIcon name="checkroom" className="text-[32px]" />
        </div>
        <h4 className="font-headline-md-mobile mb-2 text-on-surface">建立你的衣柜</h4>
        <p className="font-body-md mb-6 max-w-[250px] text-on-surface-variant">
          添加更多衣物，记录宝宝的舒适度，获取更智能的穿搭建议。
        </p>
        <Link
          href="/add"
          className="font-body-lg flex min-h-touch-target-min items-center gap-2 rounded-full bg-primary px-8 text-on-primary cloud-shadow transition-colors hover:bg-surface-tint"
        >
          <MaterialIcon name="add" />
          添加衣物
        </Link>
      </div>
    </>
  );
}

function WardrobeCard({ item }: { item: DbClothingItem }) {
  const season = seasonBadgeLabel(item.season_tags);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest cloud-shadow transition-all duration-300 hover:-translate-y-1 hover:cloud-shadow-active">
      <div className="relative aspect-square w-full bg-surface-container">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full rounded-t-xl object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-fixed-dim/20">
            <MaterialIcon name="laundry" className="text-[48px] text-primary/30" />
          </div>
        )}
        <FavoriteButton itemId={item.id} initial={item.is_favorite ?? false} />
      </div>
      <div className="flex flex-grow flex-col gap-2 p-3">
        <div>
          <h3 className="font-body-md leading-tight font-medium text-on-surface">{item.name}</h3>
          <p className="text-sm text-on-surface-variant">{item.size_label ?? "—"}</p>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-surface-variant pt-2">
          <div className="flex items-center gap-1 text-secondary">
            <MaterialIcon name="device_thermostat" className="text-[16px]" />
            <span className="font-data-heavy text-[14px]">
              {warmthIndexLabel(Number(item.warmth_score))}
            </span>
          </div>
          {season && (
            <span
              className={`font-label-caps rounded-full px-2 py-1 text-[10px] ${seasonBadgeClass(season)}`}
            >
              {season}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FavoriteButton({ itemId, initial }: { itemId: string; initial: boolean }) {
  const [favorite, setFavorite] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    const next = !favorite;
    setFavorite(next);
    setLoading(true);
    try {
      await fetch(`/api/clothing/${itemId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: next }),
      });
    } catch {
      setFavorite(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest/90 text-outline backdrop-blur-sm"
      aria-label={favorite ? "Remove favorite" : "Add favorite"}
    >
      <MaterialIcon name={favorite ? "favorite" : "favorite_border"} filled={favorite} className="text-[18px]" />
    </button>
  );
}

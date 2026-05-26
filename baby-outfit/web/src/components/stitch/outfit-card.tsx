import Link from "next/link";
import type { RecommendedPiece } from "@baby-outfit/core";
import type { ClothingDisplayMeta } from "@/lib/clothing-display";
import { outfitSecondaryBadge } from "@/lib/clothing-display";
import { MaterialIcon } from "./material-icon";
import { layerLabel } from "@/lib/stitch-utils";

function ClothingPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-container">
      <MaterialIcon name="checkroom" className="text-[32px] text-primary/30" />
    </div>
  );
}

export function OutfitCard({
  piece,
  meta,
  activityLevel,
}: {
  piece: RecommendedPiece;
  meta?: ClothingDisplayMeta;
  activityLevel?: string;
}) {
  const { item, layerOrder } = piece;
  const displayMeta: ClothingDisplayMeta = meta ?? { category: item.category };
  const secondary = outfitSecondaryBadge(layerOrder, displayMeta, activityLevel);

  return (
    <Link
      href="/wardrobe"
      className="flex items-center gap-4 rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 cloud-shadow transition-transform hover:scale-[1.02]"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover mix-blend-multiply"
          />
        ) : (
          <ClothingPlaceholder />
        )}
      </div>
      <div className="flex grow flex-col gap-2">
        <span className="font-label-caps text-outline">{layerLabel(layerOrder)}</span>
        <h3 className="font-body-lg text-on-surface">{item.name}</h3>
        <div className="mt-1 flex gap-2">
          <div className="flex w-fit items-center gap-1 rounded-full bg-secondary-fixed px-2 py-1 text-on-secondary-fixed">
            <MaterialIcon name="local_fire_department" className="text-[14px]" />
            <span className="font-data-heavy text-[14px]">{Math.round(item.warmthScore)}</span>
          </div>
          <div className="flex w-fit items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-1 text-on-tertiary-fixed">
            <MaterialIcon name={secondary.icon} className="text-[14px]" />
            <span className="font-data-heavy text-[14px]">{secondary.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

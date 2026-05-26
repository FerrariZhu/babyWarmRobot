"use client";

import Link from "next/link";
import { nextVariant, variantLabel } from "@/lib/stitch-utils";

export function SwapSetLink({
  currentVariant,
  scenario,
}: {
  currentVariant: string;
  scenario: string;
}) {
  const next = nextVariant(currentVariant);

  return (
    <Link
      href={`/?scenario=${scenario}&variant=${next}`}
      className="font-label-caps text-primary hover:underline"
      title={`切换至${variantLabel(next)}`}
    >
      换一套
    </Link>
  );
}

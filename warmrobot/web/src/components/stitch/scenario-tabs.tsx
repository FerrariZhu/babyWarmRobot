import Link from "next/link";
import type { Scenario } from "@warmrobot/core";
import { SCENARIO_LABELS } from "@/lib/db/types";

const SCENARIOS: Scenario[] = ["outdoor", "indoor", "sleep"];

export function ScenarioTabs({
  active,
  variant,
}: {
  active: Scenario;
  variant?: string;
}) {
  const variantParam = variant ? `&variant=${variant}` : "";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SCENARIOS.map((s) => (
        <Link
          key={s}
          href={`/?scenario=${s}${variantParam}`}
          className={
            active === s
              ? "shrink-0 rounded-full bg-primary px-5 py-2 font-label-caps text-on-primary transition-transform active:scale-95"
              : "shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-2 font-label-caps text-on-surface-variant cloud-shadow transition-all hover:bg-surface-container-low active:scale-95"
          }
        >
          {SCENARIO_LABELS[s]}
        </Link>
      ))}
    </div>
  );
}

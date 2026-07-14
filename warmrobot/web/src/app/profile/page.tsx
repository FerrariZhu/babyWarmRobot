import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfilePageData } from "@/lib/profile";
import { AppShell } from "@/components/stitch/app-shell";
import { MaterialIcon } from "@/components/stitch/material-icon";
import { SignOutButton } from "@/components/sign-out-button";
import { formatBabyAge } from "@/lib/clothing-display";
import { genderLabel, resolveBabyAvatarUrl, warmthPreferenceLabel } from "@/lib/baby-profile";

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data) redirect("/login");

  const { baby, warmthPreference, wardrobeCount, topCategoryLabel } = data;

  return (
    <AppShell babyName={baby?.name} avatarUrl={baby?.avatar_url} babyGender={baby?.gender} headerVariant="centered">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 overflow-y-auto px-margin-mobile pt-2 pb-32">
        {baby ? (
          <>
            <section className="relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-container-lowest p-6 cloud-shadow">
              <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-fixed opacity-30 blur-2xl" />
              <div className="z-10 mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-surface-container-lowest cloud-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveBabyAvatarUrl(baby.avatar_url, baby.gender)}
                  alt={baby.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="font-display-lg-mobile z-10 mb-1 text-on-surface">{baby.name}</h2>
              <p className="font-body-lg z-10 mb-6 text-on-surface-variant">
                {formatBabyAge(baby.birth_date)}
                {baby.gender ? ` · ${genderLabel(baby.gender)}` : ""}
              </p>
              <div className="z-10 flex w-full gap-3">
                <StatTile
                  label="身高"
                  value={baby.height_cm ? String(Math.round(Number(baby.height_cm))) : "—"}
                  unit={baby.height_cm ? "cm" : ""}
                />
                <StatTile
                  label="体重"
                  value={baby.weight_kg ? Number(baby.weight_kg).toFixed(1) : "—"}
                  unit={baby.weight_kg ? "kg" : ""}
                />
              </div>
            </section>

            <section>
              <h3 className="font-headline-md-mobile mb-4 text-on-surface">衣柜概览</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl bg-surface-container-highest p-5 cloud-shadow">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                    <MaterialIcon name="checkroom" filled />
                  </div>
                  <div>
                    <p className="font-data-heavy mb-1 text-on-surface">{wardrobeCount}</p>
                    <p className="font-label-caps text-on-surface-variant">衣柜总量</p>
                  </div>
                </div>
                <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl bg-tertiary-fixed p-5 cloud-shadow">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/50 text-on-tertiary-fixed backdrop-blur-sm">
                    <MaterialIcon name="favorite" filled />
                  </div>
                  <div>
                    <p className="font-data-heavy mb-1 text-on-tertiary-fixed">
                      {topCategoryLabel ?? "—"}
                    </p>
                    <p className="font-label-caps text-on-tertiary-fixed-variant">常穿类别</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-xl bg-surface-container-lowest p-8 text-center cloud-shadow">
            <MaterialIcon name="child_care" className="mb-3 text-[40px] text-primary/40" />
            <p className="font-body-md mb-4 text-on-surface-variant">暂无宝宝档案</p>
            <Link
              href="/profile/add"
              className="font-label-caps inline-flex min-h-touch-target-min items-center justify-center gap-2 rounded-full bg-primary px-6 text-on-primary"
            >
              <MaterialIcon name="add" className="text-[18px]" />
              添加宝宝
            </Link>
          </section>
        )}

        <section>
          <h3 className="font-headline-md-mobile mb-4 text-on-surface">设置</h3>
          <div className="flex flex-col gap-2">
            <SettingsLink
              href={baby ? "/profile/edit" : "/profile/add"}
              icon={baby ? "edit" : "add"}
              iconClass="bg-secondary-fixed text-on-secondary-fixed"
              label={baby ? "编辑资料" : "添加宝宝"}
            />
            <SettingsRow
              icon="thermostat"
              iconClass="bg-tertiary-container text-on-tertiary-container"
              label="偏好设置"
              subtitle={warmthPreferenceLabel(warmthPreference)}
            />
            <SettingsRow
              icon="help"
              iconClass="bg-surface-container-high text-on-surface-variant"
              label="帮助与支持"
            />
          </div>
        </section>

        <SignOutButton />
      </main>
    </AppShell>
  );
}

function StatTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-surface-variant/50 bg-surface-container-low py-3 px-4">
      <span className="font-label-caps mb-1 text-outline">{label}</span>
      <span className="font-data-heavy text-primary">
        {value}{" "}
        {unit && <span className="font-body-md font-normal text-on-surface-variant">{unit}</span>}
      </span>
    </div>
  );
}

function SettingsLink({
  href,
  icon,
  iconClass,
  label,
}: {
  href: string;
  icon: string;
  iconClass: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="active-lift flex w-full items-center justify-between rounded-xl bg-surface-container-lowest p-4 text-left cloud-shadow transition-colors hover:bg-surface-variant/50"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          <MaterialIcon name={icon} />
        </div>
        <span className="font-body-lg text-on-surface">{label}</span>
      </div>
      <MaterialIcon name="chevron_right" className="text-outline" />
    </Link>
  );
}

function SettingsRow({
  icon,
  iconClass,
  label,
  subtitle,
}: {
  icon: string;
  iconClass: string;
  label: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      className="active-lift flex w-full items-center justify-between rounded-xl bg-surface-container-lowest p-4 text-left cloud-shadow transition-colors hover:bg-surface-variant/50"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          <MaterialIcon name={icon} />
        </div>
        <div>
          <span className="font-body-lg block text-on-surface">{label}</span>
          {subtitle && (
            <span className="font-body-md mt-0.5 block text-on-surface-variant">{subtitle}</span>
          )}
        </div>
      </div>
      <MaterialIcon name="chevron_right" className="text-outline" />
    </button>
  );
}

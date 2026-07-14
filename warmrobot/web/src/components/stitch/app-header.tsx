import { MaterialIcon } from "./material-icon";
import { resolveBabyAvatarUrl } from "@/lib/baby-profile";
import type { BabyGender } from "@/lib/baby-profile";

type HeaderVariant = "brand" | "centered";

export function AppHeader({
  babyName,
  avatarUrl,
  babyGender,
  variant = "brand",
  title = "LittleCompass",
}: {
  babyName?: string;
  avatarUrl?: string | null;
  babyGender?: BabyGender | string | null;
  variant?: HeaderVariant;
  title?: string;
}) {
  const avatarSrc = resolveBabyAvatarUrl(avatarUrl, babyGender);

  const avatar = (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
    </div>
  );

  const notifyBtn = (
    <button
      type="button"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
      aria-label="Notifications"
    >
      <MaterialIcon name="notifications" />
    </button>
  );

  if (variant === "centered") {
    return (
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-background px-margin-mobile py-4">
        {avatar}
        <h1 className="font-headline-md-mobile mx-4 flex-1 text-center font-bold tracking-tight text-primary">
          {title}
        </h1>
        {notifyBtn}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-background px-margin-mobile py-4 text-primary">
      <div className="flex items-center gap-3">
        {avatar}
        <span className="font-display-lg-mobile tracking-tight text-primary">LittleCompass</span>
      </div>
      {notifyBtn}
    </header>
  );
}

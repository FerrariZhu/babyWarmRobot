import { AppHeader } from "@/components/stitch/app-header";
import { BottomNav } from "@/components/stitch/bottom-nav";

export function AppShell({
  children,
  babyName,
  avatarUrl,
  headerVariant = "brand",
  headerTitle,
  showNav = true,
}: {
  children: React.ReactNode;
  babyName?: string;
  avatarUrl?: string | null;
  headerVariant?: "brand" | "centered";
  headerTitle?: string;
  showNav?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background pb-[100px] text-on-background">
      <AppHeader
        babyName={babyName}
        avatarUrl={avatarUrl}
        variant={headerVariant}
        title={headerTitle}
      />
      {children}
      {showNav && <BottomNav />}
    </div>
  );
}

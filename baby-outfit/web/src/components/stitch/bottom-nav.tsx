"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "./material-icon";

const tabs = [
  { href: "/", label: "首页", icon: "home_health", filledWhenActive: true },
  { href: "/wardrobe", label: "衣柜", icon: "checkroom" },
  { href: "/add", label: "添加", icon: "add_circle", filledWhenActive: true },
  { href: "/profile", label: "我的", icon: "child_care", filledWhenActive: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl bg-surface-container-lowest px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(62,102,88,0.06)] md:hidden">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "flex scale-90 flex-col items-center justify-center rounded-full bg-primary-container px-5 py-2 text-on-primary-container transition-transform duration-200"
                : "group flex flex-col items-center justify-center rounded-full p-2 text-outline transition-all hover:bg-surface-variant/50"
            }
          >
            <MaterialIcon
              name={tab.icon}
              filled={active && ("filledWhenActive" in tab ? tab.filledWhenActive : false)}
              className={active ? undefined : "mb-1 duration-200 group-active:scale-90"}
            />
            <span className="font-label-caps mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

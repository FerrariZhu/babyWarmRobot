import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LittleCompass",
  description: "根据天气和宝宝衣柜，推荐今日穿搭",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

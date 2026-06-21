import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTitleChanger } from "@/components/PageTitleChanger";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Keronshans",
  description: "小猫的小窝：算法竞赛、CS 学习与日常整理。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-body transition-colors duration-300 min-h-screen" style={{ color: "var(--owl-text)" }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PageTitleChanger />
          <Navigation />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

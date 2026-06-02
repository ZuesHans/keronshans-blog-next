import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTitleChanger } from "@/components/PageTitleChanger";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Keronshans | 技术博客",
  description: "ACM竞争编程博客 - 算法、模板、错题本",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body transition-colors duration-300 min-h-screen" style={{ background: "var(--owl-bg)", color: "var(--owl-text)" }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PageTitleChanger />
          <Navigation />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

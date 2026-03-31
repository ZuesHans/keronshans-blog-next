import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTitleChanger } from "@/components/PageTitleChanger";
import Navigation from "@/components/Navigation";
import BinaryRain from "@/components/BinaryRain";

export const metadata: Metadata = {
  title: "Keronshans | Cyberpunk Blog",
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-white dark:bg-cyber-dark text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <PageTitleChanger />
          <BinaryRain />
          <Navigation />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

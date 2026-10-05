import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import "@/themes/graphite/graphite.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTitleChanger } from "@/components/PageTitleChanger";
import Navigation from "@/components/Navigation";
import { getTheme } from "@/themes/registry";

export const metadata: Metadata = {
  title: "Keronshans",
  description: "Keronshans",
  icons: { icon: "/avatar.jpg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`font-body transition-colors duration-300 min-h-screen ${getTheme().className}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <PageTitleChanger />
          <Navigation />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

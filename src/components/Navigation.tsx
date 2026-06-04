"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "home", label: "首页" },
  { id: "posts", label: "文章" },
  { id: "snippets", label: "片段" },
  { id: "problems", label: "题单" },
  { id: "checkin", label: "打卡" },
  { id: "talks", label: "说说" },
  { id: "tools", label: "工具" },
  { id: "about", label: "关于" },
  { id: "dashboard", label: "管理" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    setActive(segments[0] || "home");
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNav = useCallback((id: string) => {
    setActive(id);
    setMenuOpen(false);
  }, []);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const themeIcon =
    resolvedTheme === "dark" ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );

  return (
    <>
      <nav
        style={{
          background: scrolled ? "color-mix(in srgb, var(--owl-bgCard) 86%, transparent)" : "var(--owl-bg)",
          backdropFilter: scrolled ? "blur(12px)" : undefined,
          borderBottom: scrolled ? "1px solid var(--owl-border)" : "1px solid transparent",
          transition: "all 0.2s ease",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group" onClick={() => handleNav("home")}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-semibold transition-colors"
                style={{ background: "var(--owl-text)", border: "1px solid var(--owl-border)", color: "var(--owl-bgCard)" }}
              >
                K
              </div>
              <span className="font-display font-semibold text-base hidden sm:block" style={{ color: "var(--owl-text)" }}>
                Keron<span style={{ color: "var(--neon-accent)" }}>shans</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.id === "home" ? "/" : `/${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: isActive ? "var(--owl-bgSubtle)" : "transparent",
                      color: isActive ? "var(--owl-text)" : "var(--owl-textMuted)",
                      border: isActive ? "1px solid var(--owl-border)" : "1px solid transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg transition-all" style={{ color: "var(--owl-textMuted)" }} title="搜索" aria-label="搜索">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>

              {mounted && (
                <button onClick={toggleTheme} className="p-2 rounded-lg transition-all" style={{ color: "var(--owl-textMuted)" }} title="切换主题" aria-label="切换主题">
                  {themeIcon}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              {mounted && (
                <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ color: "var(--owl-textMuted)" }} title="切换主题" aria-label="切换主题">
                  {themeIcon}
                </button>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg" style={{ color: "var(--owl-textMuted)" }} title="菜单" aria-label="菜单">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div style={{ borderTop: "1px solid var(--owl-border)", background: "color-mix(in srgb, var(--owl-bgCard) 90%, transparent)", backdropFilter: "blur(12px)" }}>
            <div className="max-w-6xl mx-auto px-6 py-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--owl-textMuted)" }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索文章、模板、标签..."
                  className="cyber-input pl-10"
                  autoFocus
                />
                {searchQuery && (
                  <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="absolute right-3 top-1/2 -translate-y-1/2 cyber-btn text-xs px-3 py-1">
                    搜索
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 right-0 w-64 shadow-xl" style={{ background: "var(--owl-bgCard)", borderLeft: "1px solid var(--owl-border)", borderBottom: "1px solid var(--owl-border)" }}>
            <div className="py-2">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.id === "home" ? "/" : `/${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-all"
                    style={{
                      background: isActive ? "var(--owl-bgCard)" : "transparent",
                      color: isActive ? "var(--owl-text)" : "var(--owl-textMuted)",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

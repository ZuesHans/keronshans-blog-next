"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "home", label: "首页", icon: "🏠️" },
  { id: "posts", label: "文章", icon: "📖" },
  { id: "snippets", label: "代码片段", icon: "{}" },
  { id: "problems", label: "题单", icon: "📖" },
  { id: "checkin", label: "打卡", icon: "📊" },
  { id: "talks", label: "说说", icon: "😽" },
  { id: "tools", label: "工具", icon: "⚡" },
  { id: "about", label: "关于", icon: "🤔" },
  { id: "dashboard", label: "管理", icon: "⚙" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Sync active tab with current URL pathname
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0] || "home";
    setActive(first);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNav = useCallback((id: string) => {
    setActive(id);
    setMenuOpen(false);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === "dark") setTheme("light");
    else setTheme("dark");
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white/90 dark:bg-cyber-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-owl-border"
            : "bg-white dark:bg-cyber-dark border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" onClick={() => handleNav("home")}>
              <div className="w-8 h-8 rounded-lg bg-owl-bgCard dark:bg-owl-bgCard border border-gray-200 dark:border-owl-border flex items-center justify-center text-sm font-display font-semibold text-owl-text dark:text-owl-text group-hover:border-owl-borderHover transition-colors">
                K
              </div>
              <span className="font-display font-semibold text-base hidden sm:block">
                <span className="text-owl-text dark:text-owl-text">keron</span>
                <span className="text-neon-blue">shans</span>
              </span>
            </Link>

            {/* Desktop Nav - Right side */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.id === "home" ? "/" : `/${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    active === item.id
                      ? "bg-owl-bgCard dark:bg-owl-bgCard text-neon-blue border border-owl-borderHover"
                      : "text-owl-textMuted hover:text-owl-text hover:bg-owl-bgSubtle"
                  }`}
                >
                  <span className="mr-1.5 text-xs">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-owl-textMuted hover:text-owl-text hover:bg-owl-bgSubtle transition-all"
                title="搜索"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-owl-textMuted hover:text-owl-text hover:bg-owl-bgSubtle transition-all"
                  title="切换主题"
                >
                  {resolvedTheme === "dark" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              {mounted && (
                <button onClick={toggleTheme} className="p-2 rounded-lg text-owl-textMuted">
                  {resolvedTheme === "dark" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                </button>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-owl-textMuted hover:bg-owl-bgSubtle"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {menuOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-gray-100 dark:border-owl-border bg-white/90 dark:bg-cyber-dark/90 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 py-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-owl-textMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文章、模板、标签..."
                  className="cyber-input pl-10"
                  autoFocus
                />
                {searchQuery && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cyber-btn text-xs px-3 py-1"
                  >
                    搜索
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 right-0 w-64 bg-white dark:bg-owl-bgCard border-l border-b border-gray-100 dark:border-owl-border shadow-xl">
            <div className="py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.id === "home" ? "/" : `/${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                    active === item.id
                      ? "bg-owl-bgCard text-neon-blue"
                      : "text-owl-textMuted hover:bg-owl-bgSubtle hover:text-owl-text"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

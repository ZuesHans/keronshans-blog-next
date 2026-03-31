"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
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
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-cyber-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-cyber-border shadow-lg shadow-black/5 dark:shadow-neon-pink/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" onClick={() => handleNav("home")}>
              <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-pink to-neon-blue flex items-center justify-center text-white font-display font-bold text-sm group-hover:shadow-lg group-hover:shadow-neon-pink/20 transition-all">
                K
              </div>
              <span className="font-display font-bold text-lg hidden sm:block">
                <span className="neon-text">Keron</span>
                <span className="text-gray-600 dark:text-gray-400">shans</span>
              </span>
            </Link>

            {/* Desktop Nav - Right side */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.id === "home" ? "/" : `/${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-300 ${
                    active === item.id
                      ? "bg-neon-pink/10 text-neon-pink neon-border"
                      : "text-gray-600 dark:text-gray-400 hover:text-neon-pink dark:hover:text-neon-pink hover:bg-gray-100 dark:hover:bg-cyber-card"
                  }`}
                >
                  <span className="mr-1.5 text-xs">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-neon-blue hover:bg-gray-100 dark:hover:bg-cyber-card transition-all"
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
                  className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-neon-green hover:bg-gray-100 dark:hover:bg-cyber-card transition-all"
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
                <button onClick={toggleTheme} className="p-2 rounded-md text-gray-600 dark:text-gray-400">
                  {resolvedTheme === "dark" ? "☀️" : "🌙"}
                </button>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-cyber-card"
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
          <div className="border-t border-gray-200 dark:border-cyber-border bg-white/95 dark:bg-cyber-dark/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 cyber-btn text-xs px-2 py-1"
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 right-0 w-64 bg-white dark:bg-cyber-card border-l border-b border-gray-200 dark:border-cyber-border shadow-xl">
            <div className="py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.id === "home" ? "/" : `/${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all ${
                    active === item.id
                      ? "bg-neon-pink/10 text-neon-pink"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-cyber-surface"
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

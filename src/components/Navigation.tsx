"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SearchDialog from "@/components/SearchDialog";

const PRIMARY_NAV_ITEMS = [
  { id: "home", label: "首页", href: "/" },
  { id: "posts", label: "文章", href: "/posts" },
  { id: "problems", label: "题单", href: "/problems" },
  { id: "snippets", label: "模板", href: "/templates" },
];

const MORE_NAV_ITEMS = [
  { id: "checkin", label: "打卡", href: "/checkin" },
  { id: "talks", label: "说说", href: "/talks" },
  { id: "tools", label: "工具", href: "/tools" },
  { id: "projects", label: "展示", href: "/projects" },
  { id: "about", label: "关于", href: "/about" },
  { id: "dashboard", label: "管理", href: "/dashboard" },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS];

export default function Navigation() {
  const pathname = usePathname();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    setActive(segments[0] || "home");
    setMenuOpen(false);
    setMoreOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setMoreOpen(false);
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleNav = useCallback((id: string) => {
    setActive(id);
    setMenuOpen(false);
    setMoreOpen(false);
  }, []);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const openSearch = () => {
    setMenuOpen(false);
    setMoreOpen(false);
    setSearchOpen(true);
  };

  const themeIcon = resolvedTheme === "dark" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  return (
    <>
      <nav className={`site-navigation ${scrolled ? "is-scrolled" : ""}`} aria-label="主要导航">
        <div className="site-navigation-shell">
          <Link href="/" className="site-brand" onClick={() => handleNav("home")} aria-label="Keronshans 首页">
            <span className="site-brand-mark" aria-hidden="true">K</span>
            <span>Keronshans</span>
          </Link>

          <div className="site-navigation-primary">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => handleNav(item.id)} className={`site-navigation-link ${active === item.id ? "is-active" : ""}`}>
                {item.label}
              </Link>
            ))}

            <div className="site-more-menu" ref={moreMenuRef}>
              <button
                type="button"
                className={`site-navigation-link ${MORE_NAV_ITEMS.some((item) => item.id === active) ? "is-active" : ""}`}
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                更多
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>
              {moreOpen && (
                <div className="site-more-popover" role="menu">
                  {MORE_NAV_ITEMS.map((item) => (
                    <Link key={item.id} href={item.href} role="menuitem" onClick={() => handleNav(item.id)} className={active === item.id ? "is-active" : ""}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="site-navigation-actions">
            <button onClick={openSearch} className="site-icon-button" title="搜索" aria-label="搜索">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            {mounted && (
              <button onClick={toggleTheme} className="site-icon-button" title="切换主题" aria-label="切换主题">
                {themeIcon}
              </button>
            )}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="site-icon-button site-mobile-menu-button"
              title="菜单"
              aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {menuOpen && (
        <div className="site-mobile-overlay">
          <button className="site-mobile-backdrop" onClick={() => setMenuOpen(false)} aria-label="关闭菜单" />
          <div className="site-mobile-panel">
            {ALL_NAV_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => handleNav(item.id)} className={active === item.id ? "is-active" : ""}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

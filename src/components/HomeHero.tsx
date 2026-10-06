"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function HomeHero() {
  const coverRef = useRef<HTMLElement>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      const progress = Math.min(1, Math.max(0, -cover.getBoundingClientRect().top / cover.offsetHeight));
      cover.style.setProperty("--hero-progress", String(progress));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={coverRef} className="home-cover" aria-labelledby="homeTitle">
      <div className={`home-cover-image${imageReady ? " is-ready" : ""}`}>
        <Image src="/about-summer-solstice.png" alt="夏至荷塘" fill priority sizes="100vw"
          onLoad={() => setImageReady(true)} />
      </div>
      <div className="home-cover-shade" aria-hidden="true" />
      <div className="site-shell home-cover-content">
        <h1 id="homeTitle">Keronshans</h1>
        <p className="home-lede">这里是一直会打字的小猫...</p>
        <div className="home-cover-actions">
          <Link href="/posts">文章 <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <span aria-hidden="true">/</span>
          <Link href="/about">关于我</Link>
        </div>
      </div>
      <a className="home-scroll-link" href="#latest" aria-label="查看最近更新" title="最近更新"
        onClick={(event) => {
          const latest = document.getElementById("latest");
          if (!latest) return;
          event.preventDefault();
          latest.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        }}>
        <ArrowDown size={22} aria-hidden="true" />
      </a>
    </section>
  );
}

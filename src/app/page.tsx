import { Link } from "next-view-transitions";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_GROUPS, getAllPosts } from "@/lib/posts";
import PostCard from "@/components/theme/PostCard";
import HomeHero from "@/components/HomeHero";

export const dynamic = "force-static";

export default async function HomePage() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, 12);
  const visibleCategories = CATEGORY_GROUPS.slice(0, 5);
  const categoryCounts = Object.fromEntries(
    CATEGORY_GROUPS.map((group) => [group.name, posts.filter((post) => post.category === group.name).length])
  );

  return (
    <div className="home-page -mt-16">
      <HomeHero />

      <section id="latest" className="home-content-band" aria-labelledby="latestTitle">
        <div className="site-shell home-writing-inner">
          <header className="home-band-heading">
            <div>
              <h2 id="latestTitle">最近更新</h2>
            </div>
            <Link href="/posts">全部文章 <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </header>

          <div className="home-post-grid">
            {featuredPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      </section>

      <section className="home-category-band" aria-labelledby="categoryTitle">
        <div className="site-shell home-category-layout">
          <div>
            <h2 id="categoryTitle">分类</h2>
          </div>
          <div className="home-category-grid">
            {visibleCategories.map((group) => (
              <Link
                key={group.name}
                href={`/posts?category=${encodeURIComponent(group.name)}`}
                className="home-category-link"
                style={{ "--tile-accent": group.accent } as CSSProperties}
              >
                <span>{group.name}</span>
                <strong>{categoryCounts[group.name] || 0}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

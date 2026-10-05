import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://keronshans.top";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const pages = ["", "/posts", "/about", "/templates", "/problems"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  return [...pages, ...posts.map((post) => ({ url: `${siteUrl}/posts/${post.slug}`, lastModified: post.date || undefined, changeFrequency: "monthly" as const, priority: post.pinned ? 0.8 : 0.6 }))];
}

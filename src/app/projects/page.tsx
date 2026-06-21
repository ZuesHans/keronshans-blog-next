import Link from "next/link";
import type { CSSProperties } from "react";
import { projectCategories, projects, type ProjectLink } from "./projects";

const totalLinks = projects.reduce((count, project) => count + project.links.length, 0);
const allTags = Array.from(new Set(projects.flatMap((project) => project.tags)));

function ProjectAction({ link }: { link: ProjectLink }) {
  const isExternal = link.href.startsWith("http");

  return (
    <Link
      href={link.href}
      target={isExternal ? "_blank" : undefined}
      className="cyber-btn inline-flex items-center gap-2 px-3 py-1.5 text-xs"
    >
      {link.label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
      <section className="mb-10 border-b pb-8" style={{ borderColor: "var(--owl-border)" }}>
        <div className="page-kicker mb-3">Projects</div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="page-heading mb-4">项目陈列室</h1>
            <p className="max-w-3xl text-base leading-8" style={{ color: "var(--owl-textSecondary)" }}>
              这里不做单纯的作品墙，而是把每个项目当成一条可以继续往下读的记录：它从哪里来、解决什么、现在到哪一步。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="cyber-card p-4">
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">条目</div>
            </div>
            <div className="cyber-card p-4">
              <div className="stat-value">{projectCategories.length}</div>
              <div className="stat-label">分类</div>
            </div>
            <div className="cyber-card p-4">
              <div className="stat-value">{totalLinks}</div>
              <div className="stat-label">入口</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="side-block border-t-0 pt-0">
            <div className="side-block-title">Categories</div>
            <div className="flex flex-wrap gap-2 lg:grid">
              {projectCategories.map((category) => (
                <a key={category} href={`#category-${category}`} className="tag-filter">
                  {category}
                </a>
              ))}
            </div>
          </div>

          <div className="side-block mt-8">
            <div className="side-block-title">Tags</div>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 18).map((tag) => (
                <span key={tag} className="tag-pill cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-12">
          {projectCategories.map((category) => {
            const categoryProjects = projects.filter((project) => project.category === category);

            return (
              <section key={category} id={`category-${category}`} className="scroll-mt-24">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-medium" style={{ color: "var(--owl-text)" }}>
                      {category}
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--owl-textMuted)" }}>
                      {categoryProjects.length} 条
                    </p>
                  </div>
                  <Link href="/about" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--neon-accent)" }}>
                    回到 About
                  </Link>
                </div>

                <div className="relative space-y-5 before:absolute before:bottom-8 before:left-5 before:top-8 before:w-px before:bg-[var(--owl-border)] sm:before:left-7">
                  {categoryProjects.map((project, index) => (
                    <article
                      key={project.id}
                      className="relative grid gap-4 pl-14 sm:pl-20"
                      style={{ "--project-accent": index % 2 === 0 ? "var(--neon-accent)" : "var(--neon-green)" } as CSSProperties}
                    >
                      <div
                        className="absolute left-0 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold sm:h-14 sm:w-14"
                        style={{
                          background: "var(--owl-bgCard)",
                          borderColor: "var(--owl-border)",
                          color: "var(--project-accent)",
                          boxShadow: "var(--owl-shadow)",
                        }}
                      >
                        K
                      </div>

                      <div className="cyber-card p-5 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs" style={{ color: "var(--owl-textMuted)" }}>
                          <span className="font-semibold" style={{ color: "var(--owl-text)" }}>
                            Keronshans
                          </span>
                          <span>@projects</span>
                          <span>{project.period}</span>
                          <span className="rounded-md px-2 py-0.5" style={{ background: "var(--owl-tagBg)", color: "var(--owl-tagText)" }}>
                            {project.status}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--project-accent)" }}>
                            {project.category}
                          </div>
                          <h3 className="font-display text-2xl font-medium leading-tight" style={{ color: "var(--owl-text)" }}>
                            {project.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7" style={{ color: "var(--owl-textSecondary)" }}>
                            {project.summary}
                          </p>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span key={tag} className="tag-pill cursor-default">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-3 border-l pl-4" style={{ borderColor: "var(--owl-border)" }}>
                          {project.thread.map((line) => (
                            <p key={line} className="text-sm leading-7" style={{ color: "var(--owl-textSecondary)" }}>
                              {line}
                            </p>
                          ))}
                        </div>

                        {project.links.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {project.links.map((link) => (
                              <ProjectAction key={`${project.id}-${link.href}`} link={link} />
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}

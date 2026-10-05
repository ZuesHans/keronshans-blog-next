import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="theme-page-header">
      <div>
        {eyebrow && <p className="theme-page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="theme-page-description">{description}</p>}
      </div>
      {actions && <div className="theme-page-actions">{actions}</div>}
    </header>
  );
}

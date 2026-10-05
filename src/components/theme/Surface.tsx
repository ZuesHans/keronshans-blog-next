import type { HTMLAttributes } from "react";

export default function Surface({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`theme-surface ${className}`.trim()} {...props} />;
}

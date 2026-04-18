"use client";

import { useState } from "react";

interface CopyBtnProps {
  slug: string;
  title: string;
}

export default function CopyBtn({ slug, title }: CopyBtnProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const res = await fetch(`/api/template/${slug}`);
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      window.open(`/posts/${slug}`, "_blank");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`cyber-btn-green text-sm px-3 transition-all ${copied ? "!bg-neon-green/30" : ""}`}
      title={`复制 ${title} 模板内容`}
    >
      {copied ? "✓" : "📋"}
    </button>
  );
}

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const codeString = String(children).replace(/\n$/, "");
  const language = className?.replace("language-", "") || "text";
  const lines = codeString.split("\n").length;
  const canCollapse = lines > 18;

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="code-panel">
      <div className="code-toolbar">
        <span>{language}</span>
        <div className="flex items-center gap-2">
          {canCollapse && (
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="code-action">
              {collapsed ? `展开 ${lines} 行` : "收起"}
            </button>
          )}
          <button type="button" onClick={copyCode} className="code-action">
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </div>
      <pre className={canCollapse && collapsed ? "is-collapsed" : undefined}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

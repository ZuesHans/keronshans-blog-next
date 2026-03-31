"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { useState, useCallback } from "react";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const codeString = String(children).replace(/\n$/, "");
  const lines = codeString.split("\n").length;

  // Only show collapse toggle for blocks with 5+ lines
  if (lines < 5) {
    return (
      <code className={className}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-gray-700/80 text-gray-300 hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100"
      >
        {collapsed ? `▼ 展开全部 (${lines}行)` : "▲ 收起"}
      </button>
      <code className={className} style={collapsed ? { maxHeight: "200px", overflow: "hidden", position: "relative" } : {}}>
        {children}
      </code>
      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
      )}
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
          pre: ({ children }) => <pre>{children}</pre>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <CodeBlock className={className}>
                  {children}
                </CodeBlock>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

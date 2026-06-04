"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  content: string;
}

type HastNode = {
  value?: string;
  children?: HastNode[];
};

function textFromNode(node?: HastNode): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) return node.children.map(textFromNode).join("");
  return "";
}

function CodeBlock({
  className,
  language,
  node,
  children,
}: {
  className?: string;
  language: string;
  node?: HastNode;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const codeString = (textFromNode(node) || String(children)).replace(/\n$/, "");
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
        rehypePlugins={[
          rehypeRaw,
          rehypeKatex,
          [rehypeHighlight, { aliases: { cpp: ["c++", "cc", "cxx", "h", "hpp"] } }],
        ]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, node, ...props }) => {
            const languageClass = className?.split(/\s+/).find((name) => name.startsWith("language-"));
            if (languageClass) {
              return (
                <CodeBlock className={className} language={languageClass.replace("language-", "")} node={node as HastNode}>
                  {children}
                </CodeBlock>
              );
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

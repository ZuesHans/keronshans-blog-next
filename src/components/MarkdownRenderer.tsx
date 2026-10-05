"use client";

import { createContext, useContext, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";

interface MarkdownRendererProps {
  content: string;
}

const InCodeBlock = createContext(false);

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
  const codeRegionId = useId();
  const codeString = (textFromNode(node) || String(children)).replace(/\n$/, "");
  const lines = codeString.split("\n").length;
  const canCollapse = lines > 18;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code-panel" data-language={language}>
      <div className="code-toolbar">
        <span className="code-language"><span aria-hidden="true">&lt;/&gt;</span>{language}</span>
        <div className="code-toolbar-actions">
          {canCollapse && (
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="code-action" aria-expanded={!collapsed} aria-controls={codeRegionId}>
              {collapsed ? `展开 ${lines} 行` : "收起"}
            </button>
          )}
          <button type="button" onClick={copyCode} className="code-action" aria-label={copied ? "代码已复制" : "复制代码"}>
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </div>
      <div id={codeRegionId} className={`code-content${canCollapse && collapsed ? " is-collapsed" : ""}`}>
        <div className="code-gutter" aria-hidden="true">
          {Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}
        </div>
        <pre><code className={className}>{children}</code></pre>
      </div>
      {canCollapse && collapsed && (
        <button type="button" className="code-expand" onClick={() => setCollapsed(false)} aria-controls={codeRegionId}>
          展开全部 {lines} 行 <span aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}

function MarkdownCode({ className, children, node, ...props }: {
  className?: string;
  children?: React.ReactNode;
  node?: HastNode;
}) {
  const isBlock = useContext(InCodeBlock);
  if (isBlock) {
    const languageClass = className?.split(/\s+/).find((name) => name.startsWith("language-"));
    return (
      <CodeBlock className={className} language={languageClass?.replace("language-", "") || "text"} node={node}>
        {children}
      </CodeBlock>
    );
  }
  return <code className={className} {...props}>{children}</code>;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { aliases: { cpp: ["c++", "cc", "cxx", "h", "hpp"] } }],
        ]}
        components={{
          pre: ({ children }) => <InCodeBlock.Provider value>{children}</InCodeBlock.Provider>,
          code: MarkdownCode,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

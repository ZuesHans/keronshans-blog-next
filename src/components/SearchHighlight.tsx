"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getTextHighlightRanges, normalizeSearchQuery } from "@/lib/search";

const EXCLUDED_SELECTOR = [
  "mark",
  ".katex",
  ".code-toolbar",
  "button",
  "input",
  "select",
  "textarea",
  "script",
  "style",
].join(",");

function removeHighlights(container: ParentNode) {
  container.querySelectorAll("mark[data-search-highlight]").forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(document.createTextNode(mark.textContent || ""));
    parent?.normalize();
  });
}

export default function SearchHighlight() {
  const searchParams = useSearchParams();
  const query = searchParams.get("highlight") || "";

  useEffect(() => {
    const container = document.querySelector(".markdown-body");
    if (!container) return;

    removeHighlights(container);
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest(EXCLUDED_SELECTOR)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    nodes.forEach((node) => {
      const value = node.nodeValue || "";
      const ranges = getTextHighlightRanges(value, normalizedQuery);
      if (ranges.length === 0 || !node.parentNode) return;

      const fragment = document.createDocumentFragment();
      let cursor = 0;
      ranges.forEach((range) => {
        if (range.start > cursor) fragment.append(document.createTextNode(value.slice(cursor, range.start)));
        const mark = document.createElement("mark");
        mark.className = "search-keyword";
        mark.dataset.searchHighlight = "true";
        mark.textContent = value.slice(range.start, range.start + range.length);
        fragment.append(mark);
        cursor = range.start + range.length;
      });
      if (cursor < value.length) fragment.append(document.createTextNode(value.slice(cursor)));
      node.parentNode.replaceChild(fragment, node);
    });

    return () => removeHighlights(container);
  }, [query]);

  return null;
}

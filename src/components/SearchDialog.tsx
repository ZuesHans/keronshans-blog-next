"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchMatchText from "@/components/SearchMatchText";
import {
  SEARCH_QUERY_MAX_LENGTH,
  normalizeSearchQuery,
  searchDocuments,
  type SearchDocument,
} from "@/lib/search";

interface SearchIndexResponse {
  version?: number;
  documents?: SearchDocument[];
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

let cachedDocuments: SearchDocument[] | null = null;
let pendingDocuments: Promise<SearchDocument[]> | null = null;

function loadSearchDocuments(): Promise<SearchDocument[]> {
  if (cachedDocuments) return Promise.resolve(cachedDocuments);
  if (pendingDocuments) return pendingDocuments;

  pendingDocuments = fetch("/api/search-index")
    .then(async (response) => {
      if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
      const data = (await response.json()) as SearchIndexResponse;
      if (!Array.isArray(data.documents)) throw new Error("Search index response is invalid");
      cachedDocuments = data.documents;
      return data.documents;
    })
    .catch((error) => {
      pendingDocuments = null;
      throw error;
    });

  return pendingDocuments;
}

function resultHref(document: SearchDocument, query: string) {
  const params = new URLSearchParams({ highlight: normalizeSearchQuery(query) });
  return `${document.url}?${params.toString()}`;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<SearchDocument[]>(cachedDocuments || []);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    cachedDocuments ? "ready" : "idle",
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => searchDocuments(documents, query), [documents, query]);
  const normalizedQuery = normalizeSearchQuery(query);

  const requestDocuments = useCallback(async () => {
    setStatus("loading");
    try {
      const nextDocuments = await loadSearchDocuments();
      setDocuments(nextDocuments);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [open]);

  useEffect(() => {
    if (open && status === "idle") void requestDocuments();
  }, [open, requestDocuments, status]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex >= results.length && results.length > 0) setSelectedIndex(results.length - 1);
  }, [results.length, selectedIndex]);

  useEffect(() => {
    resultRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const navigateToResult = (index: number) => {
    const result = results[index];
    if (!result) return;
    onClose();
    router.push(resultHref(result.document, query));
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      navigateToResult(selectedIndex);
    }
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        onKeyDown={handleDialogKeyDown}
      >
        <h2 id="global-search-title" className="sr-only">
          搜索文章
        </h2>
        <div className="search-dialog-head">
          <svg className="search-dialog-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, SEARCH_QUERY_MAX_LENGTH))}
            onKeyDown={handleInputKeyDown}
            className="search-dialog-input"
            type="search"
            placeholder="搜索文章"
            autoComplete="off"
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-controls="global-search-results"
            aria-activedescendant={results.length > 0 ? `global-search-result-${selectedIndex}` : undefined}
          />
          <button type="button" className="search-dialog-close" onClick={onClose} aria-label="关闭搜索" title="关闭搜索">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="search-dialog-body" aria-live="polite">
          {status === "loading" && <div className="search-dialog-state">正在载入文章索引...</div>}
          {status === "error" && (
            <div className="search-dialog-state">
              <p>搜索索引加载失败</p>
              <button type="button" className="search-retry-button" onClick={() => void requestDocuments()}>
                重试
              </button>
            </div>
          )}
          {status === "ready" && !normalizedQuery && (
            <div className="search-dialog-state">{documents.length} 篇文章</div>
          )}
          {status === "ready" && normalizedQuery && results.length === 0 && (
            <div className="search-dialog-state">没有找到“{normalizedQuery}”</div>
          )}
          {status === "ready" && results.length > 0 && (
            <ul id="global-search-results" className="search-result-list" role="listbox" aria-label="文章搜索结果">
              {results.map((result, index) => (
                <li key={result.document.id} role="presentation">
                  <button
                    ref={(node) => {
                      resultRefs.current[index] = node;
                    }}
                    id={`global-search-result-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={`search-result-item${selectedIndex === index ? " is-active" : ""}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => navigateToResult(index)}
                  >
                    <span className="search-result-title">
                      <SearchMatchText parts={result.titleParts} />
                    </span>
                    {result.snippetParts.length > 0 && (
                      <span className="search-result-snippet">
                        {result.snippetHasLeadingEllipsis && "..."}
                        <SearchMatchText parts={result.snippetParts} />
                        {result.snippetHasTrailingEllipsis && "..."}
                      </span>
                    )}
                    <span className="search-result-meta">
                      <span>{result.document.category}</span>
                      {result.document.date && <span>{result.document.date}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status === "ready" && normalizedQuery && results.length > 0 && (
          <div className="search-dialog-foot">{results.length} 条结果</div>
        )}
      </section>
    </div>
  );
}

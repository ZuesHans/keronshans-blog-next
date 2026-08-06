export const SEARCH_QUERY_MAX_LENGTH = 80;

export interface SearchDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  category: string;
  updatedAt: string;
}

export interface SearchTextPart {
  text: string;
  highlighted: boolean;
}

export interface SearchHighlightRange {
  start: number;
  length: number;
}

export interface SearchResult {
  document: SearchDocument;
  titleParts: SearchTextPart[];
  snippetParts: SearchTextPart[];
  snippetHasLeadingEllipsis: boolean;
  snippetHasTrailingEllipsis: boolean;
  includedKeywordCount: number;
  hitCount: number;
}

interface SearchMatch {
  position: number;
  length: number;
  keyword: string;
}

interface SearchSlice {
  start: number;
  end: number;
  hits: SearchMatch[];
  keywordCount: number;
}

export function normalizeSearchQuery(value: string): string {
  return String(value || "").slice(0, SEARCH_QUERY_MAX_LENGTH).trim();
}

export function getSearchKeywords(value: string): string[] {
  const query = normalizeSearchQuery(value).toLocaleLowerCase();
  if (!query) return [];
  return Array.from(new Set(query.split(/[-\s]+/u).filter(Boolean)));
}

export function normalizeSearchContent(content: string): string {
  let insideFence = false;

  return String(content || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        insideFence = !insideFence;
        return "";
      }
      if (insideFence) return line;

      return line
        .replace(/<!--.*?-->/g, " ")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^\s*>\s?/, "")
        .replace(/^\s*(?:[-+*]|\d+[.)])\s+/, "")
        .replace(/[*_~`]+/g, "");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectMatches(value: string, keywords: string[]): SearchMatch[] {
  const normalized = value.toLocaleLowerCase();
  const matches: SearchMatch[] = [];

  keywords.forEach((keyword) => {
    let start = 0;
    let position = -1;
    while ((position = normalized.indexOf(keyword, start)) >= 0) {
      matches.push({ position, length: keyword.length, keyword });
      start = position + keyword.length;
    }
  });

  return matches.sort((left, right) => left.position - right.position || right.length - left.length);
}

function nonOverlappingMatches(matches: SearchMatch[], start: number, end: number): SearchMatch[] {
  const selected: SearchMatch[] = [];
  let cursor = start;

  for (const match of matches) {
    if (match.position < start || match.position + match.length > end || match.position < cursor) continue;
    selected.push(match);
    cursor = match.position + match.length;
  }

  return selected;
}

export function getTextHighlightRanges(value: string, rawQuery: string): SearchHighlightRange[] {
  const matches = collectMatches(value, getSearchKeywords(rawQuery));
  return nonOverlappingMatches(matches, 0, value.length).map((match) => ({
    start: match.position,
    length: match.length,
  }));
}

function buildTextParts(value: string, matches: SearchMatch[], start = 0, end = value.length): SearchTextPart[] {
  const selected = nonOverlappingMatches(matches, start, end);
  if (selected.length === 0) {
    const text = value.slice(start, end);
    return text ? [{ text, highlighted: false }] : [];
  }

  const parts: SearchTextPart[] = [];
  let cursor = start;

  selected.forEach((match) => {
    if (match.position > cursor) {
      parts.push({ text: value.slice(cursor, match.position), highlighted: false });
    }
    parts.push({ text: value.slice(match.position, match.position + match.length), highlighted: true });
    cursor = match.position + match.length;
  });

  if (cursor < end) parts.push({ text: value.slice(cursor, end), highlighted: false });
  return parts;
}

function chooseContentSlice(content: string, matches: SearchMatch[]): SearchSlice | null {
  if (matches.length === 0) return null;

  const slices = matches.map((match) => {
    const start = Math.max(0, match.position - 20);
    const end = Math.min(content.length, match.position + 100);
    const hits = nonOverlappingMatches(matches, start, end);
    return {
      start,
      end,
      hits,
      keywordCount: new Set(hits.map((hit) => hit.keyword)).size,
    };
  });

  return slices.sort(
    (left, right) =>
      right.keywordCount - left.keywordCount ||
      right.hits.length - left.hits.length ||
      left.start - right.start,
  )[0];
}

export function searchDocuments(documents: SearchDocument[], rawQuery: string): SearchResult[] {
  const keywords = getSearchKeywords(rawQuery);
  if (keywords.length === 0) return [];

  return documents
    .map((document, sourceIndex) => {
      const titleMatches = collectMatches(document.title, keywords);
      const contentMatches = collectMatches(document.content, keywords);
      if (titleMatches.length === 0 && contentMatches.length === 0) return null;

      const includedKeywords = new Set(
        [...titleMatches, ...contentMatches].map((match) => match.keyword),
      );
      const snippet = chooseContentSlice(document.content, contentMatches);

      return {
        sourceIndex,
        result: {
          document,
          titleParts: buildTextParts(document.title, titleMatches),
          snippetParts: snippet
            ? buildTextParts(document.content, snippet.hits, snippet.start, snippet.end)
            : [],
          snippetHasLeadingEllipsis: Boolean(snippet && snippet.start > 0),
          snippetHasTrailingEllipsis: Boolean(snippet && snippet.end < document.content.length),
          includedKeywordCount: includedKeywords.size,
          hitCount: titleMatches.length + contentMatches.length,
        } satisfies SearchResult,
      };
    })
    .filter((entry): entry is { sourceIndex: number; result: SearchResult } => entry !== null)
    .sort(
      (left, right) =>
        right.result.includedKeywordCount - left.result.includedKeywordCount ||
        right.result.hitCount - left.result.hitCount ||
        left.sourceIndex - right.sourceIndex,
    )
    .map((entry) => entry.result);
}

import type { SearchTextPart } from "@/lib/search";

export default function SearchMatchText({ parts }: { parts: SearchTextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.highlighted ? (
          <mark key={`${part.text}-${index}`} className="search-keyword">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

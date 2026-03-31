"use client";

import { useEffect, useState } from "react";

export default function BinaryRain() {
  const [columns, setColumns] = useState<{ id: number; x: number; delay: number; duration: number; chars: string }[]>([]);

  useEffect(() => {
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
    const colCount = Math.floor(window.innerWidth / 20);
    const cols = Array.from({ length: Math.min(colCount, 50) }, (_, i) => ({
      id: i,
      x: (i / colCount) * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 15,
      chars: Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""),
    }));
    setColumns(cols);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04] dark:opacity-[0.07]">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 text-neon-pink font-mono text-xs whitespace-pre leading-tight"
          style={{
            left: `${col.x}%`,
            animation: `data-stream ${col.duration}s linear ${col.delay}s infinite`,
          }}
        >
          {col.chars.split("").map((char, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.05 }}>
              {char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

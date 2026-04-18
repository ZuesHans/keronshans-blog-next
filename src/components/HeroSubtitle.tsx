"use client";

import dynamic from "next/dynamic";

const TypewriterText = dynamic(() => import("./TypewriterText"), { ssr: false });

export default function HeroSubtitle() {
  return (
    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-6 min-h-[1.75rem]">
      <TypewriterText />
    </p>
  );
}

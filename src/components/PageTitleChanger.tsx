"use client";

import { useEffect, useRef } from "react";

const ORIGINAL_TITLE = "Keronshans|猫猫大王🐱";
const BACK_TITLE = "太好啦你回来啦！🐱";
const AWAY_TITLES = [
  "呜呜呜不要猫猫了吗😿",
  "代码还没调完呢...😿",
  "别走，还有题没刷！😿",
  "离开太久猫猫会伤心的😿",
];

export function PageTitleChanger() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const awayIdxRef = useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        awayIdxRef.current = 0;
        intervalRef.current = setInterval(() => {
          document.title = AWAY_TITLES[awayIdxRef.current % AWAY_TITLES.length];
          awayIdxRef.current++;
        }, 3000);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        document.title = BACK_TITLE;
        setTimeout(() => {
          document.title = ORIGINAL_TITLE;
        }, 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}

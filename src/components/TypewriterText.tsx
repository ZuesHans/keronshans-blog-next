"use client";

import { useState, useEffect, useCallback } from "react";

const TYPING_SENTENCES = [
  "A Little Coding Cat with love in its heart",
  "这里是猫猫的四次元（其实是2次元（01何尝不算二次元））百宝袋来的",
  "Welcome to my little bag.",
  "我不做人啦！jojo！",
  "睡觉大王说是",
  "ACMate do us apart?",
  "少说话，多刷题",
  "打a从没开心过",
  "骗你的我抖M来的",
  "小猫想要爱",
  "永恒的爱",
  "模板库收录了常用算法模板，说说功能记录日常碎片，二进制工具箱提供进制转换和位运算功能", 
  "看到这里的大概率暗恋我（开玩笑的）",
  "最讨厌猜猜看得题了", 
  "大懒猫来的喵",
];

export default function TypewriterText() {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");

  const currentSentence = TYPING_SENTENCES[sentenceIdx];

  const tick = useCallback(() => {
    if (!isDeleting) {
      setDisplayText(currentSentence.slice(0, charIdx + 1));
      if (charIdx + 1 === currentSentence.length) {
        setTimeout(() => setIsDeleting(true), 2000);
        setCharIdx(charIdx + 1);
        return;
      }
      setCharIdx(charIdx + 1);
    } else {
      setDisplayText(currentSentence.slice(0, charIdx - 1));
      if (charIdx - 1 === 0) {
        setIsDeleting(false);
        setSentenceIdx((sentenceIdx + 1) % TYPING_SENTENCES.length);
        return;
      }
      setCharIdx(charIdx - 1);
    }
  }, [charIdx, isDeleting, sentenceIdx, currentSentence]);

  useEffect(() => {
    const speed = isDeleting ? 30 : 80;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting]);

  return (
    <span className="inline-flex items-center">
      <span>{displayText}</span>
      <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle bg-neon-pink dark:bg-neon-pink animate-pulse" />
    </span>
  );
}

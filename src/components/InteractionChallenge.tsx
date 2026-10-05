"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
export default function InteractionChallenge({ onToken, revision }: { onToken: (token: string) => void; revision: number }) {
  const element = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const render = useCallback(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!api || !element.current || !sitekey) return;
    if (widget.current) api.remove(widget.current);
    widget.current = api.render(element.current, { sitekey, callback: onToken, "expired-callback": () => onToken(""), "error-callback": () => onToken(""), theme: "auto" });
  }, [onToken, sitekey]);
  useEffect(() => {
    render();
    return () => {
      const api = (window as Window & { turnstile?: Turnstile }).turnstile;
      if (api && widget.current) api.remove(widget.current);
      widget.current = null;
    };
  }, [render, revision]);
  return sitekey ? <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={render} /><div ref={element} className="mt-3" /></> : null;
}

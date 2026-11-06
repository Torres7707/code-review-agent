"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type PrototypeSwitcherProps = {
  variants: { key: string; name: string }[];
  current: string;
};

export function PrototypeSwitcher({ variants, current }: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const go = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("variant", key);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const cycle = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    if (next) go(next.key);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          variants[(index - 1 + variants.length) % variants.length];
        if (prev) go(prev.key);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = variants[(index + 1) % variants.length];
        if (next) go(next.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prototype switcher
  }, [index, variants, pathname, searchParams]);

  if (process.env.NODE_ENV === "production") return null;

  const label = variants[index] ?? variants[0];

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 shadow-xl">
      <button
        type="button"
        aria-label="Previous variant"
        className="rounded-full px-3 py-1 hover:bg-zinc-800"
        onClick={() => cycle(-1)}
      >
        ←
      </button>
      <span className="min-w-48 px-2 text-center font-mono text-xs tracking-wide">
        {label?.key} ({label?.name})
      </span>
      <button
        type="button"
        aria-label="Next variant"
        className="rounded-full px-3 py-1 hover:bg-zinc-800"
        onClick={() => cycle(1)}
      >
        →
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";

type AnimatedCounterProps = {
  target: number;
  suffix?: string;
  durationMs?: number;
};

export function AnimatedCounter({
  target,
  suffix = "",
  durationMs = 1400,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.4,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (!isIntersecting || hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isIntersecting, target, durationMs]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";

type Firefly = {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
};

type Props = {
  count?: number;
};

export function FireflyField({ count = 30 }: Props) {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);

  useEffect(() => {
    setFireflies(
      Array.from({ length: count }, (_, id) => ({
        id,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        delay: `${Math.random() * 4}s`,
        duration: `${2 + Math.random() * 3}s`,
      }))
    );
  }, [count]);

  if (!fireflies.length) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {fireflies.map((firefly) => (
        <div
          key={firefly.id}
          className="absolute rounded-full bg-firefly animate-firefly-pulse"
          style={{
            left: firefly.left,
            top: firefly.top,
            width: firefly.size,
            height: firefly.size,
            animationDelay: firefly.delay,
            animationDuration: firefly.duration,
            boxShadow: `0 0 ${firefly.size * 3}px #FEF7A3, 0 0 ${firefly.size * 6}px rgba(254,247,163,0.35)`,
          }}
        />
      ))}
    </div>
  );
}

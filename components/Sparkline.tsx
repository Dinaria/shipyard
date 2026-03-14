"use client";

import React, { useEffect, useState } from "react";

type SparklineProps = {
  data: number[];
};

const SVG_HEIGHT = 32;

export default function Sparkline({ data }: SparklineProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAnimated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!data.length) {
    return null;
  }

  const maxValue = Math.max(...data, 1);
  const slotWidth = 1; // logical units per bar
  const gap = 0.15;
  const barWidth = slotWidth - gap;
  const svgWidth = data.length * slotWidth;

  return (
    <svg
      width="100%"
      height={SVG_HEIGHT}
      viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
      preserveAspectRatio="none"
    >
      {data.map((value, index) => {
        const normalized = value / maxValue;
        const targetHeight = normalized * (SVG_HEIGHT - 4); // keep a bit of padding
        const height = animated ? targetHeight : 0;
        const y = SVG_HEIGHT - height;

        const delayMs = index * 10;

        return (
          <rect
            key={index}
            x={index * slotWidth}
            y={y}
            width={barWidth}
            height={height}
            rx={1}
            fill={value > 0 ? "#3b82f6" : "#1e1e1e"}
            style={{
              transitionProperty: "height, y",
              transitionDuration: "400ms",
              transitionTimingFunction: "ease-out",
              transitionDelay: `${delayMs}ms`,
            }}
          />
        );
      })}
    </svg>
  );
}


"use client";
import { polygonDrawPrompt } from "@/app/ai-function-prompts";
import { motion, transform } from "framer-motion";
import { useState } from "react";
import { z } from "zod";

type Props = z.infer<(typeof polygonDrawPrompt)["parameters"]>;

export function Sphere(props: Props) {
  const [angleY, setAngleY] = useState(0.3); //0-1

  const curveX = transform(
    angleY,
    [0, 1],
    [10 + 90 * (1 - 0.55228475), 100 + 90 * 0.55228475]
  );

  const angleYReverse = 1 - angleY;
  const curveFront = transform(
    angleY,
    [1, 0],
    [10 + 90 * (1 - 0.55228475), 100 + 90 * 0.55228475]
  );

  const pathFront = `\
M 60 100 \
C 60 ${curveFront} \
${300 / 2 - 90 * 0.55228475} ${angleYReverse * 180 + 10} \
150 ${angleYReverse * 180 + 10}\
C ${300 / 2 + 90 * 0.55228475} ${angleYReverse * 180 + 10} 240 ${curveFront} \
240 100`;

  const pathBack = `\
M 60 100 \
C 60 ${curveX} \
${300 / 2 - 90 * 0.55228475} ${angleY * 180 + 10} \
150 ${angleY * 180 + 10}\
C ${300 / 2 + 90 * 0.55228475} ${angleY * 180 + 10} 240 ${curveX} \
240 100`;

  const pointAtTwoOclock = circularCoordinates(90, -55);
  const pointAtTwoOclockWithOffset = circularCoordinates(50, -70);

  return (
    <>
      <motion.svg
        whileHover="containerHover"
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          color: "#94a3b8",
        }}
        viewBox="0 0 300 200"
        width="300"
        height="200"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        strokeWidth="1"
      >
        <circle
          cx="150"
          cy="100"
          r="90"
          fill="rgba(148, 163, 184, 0.1)"
          stroke="currentColor"
        />
        <circle cx="150" cy="100" r="3" fill="currentColor" />
        <path d={pathBack} stroke="#94a3b847" fill="none" />
        <path d={pathFront} stroke="currentColor" fill="none" />
        <line
          x1="150"
          y1="100"
          x2={pointAtTwoOclock[0] + 150}
          y2={pointAtTwoOclock[1] + 100}
          stroke="currentColor"
          strokeDasharray="4 4"
        />
        <line
          x1="60"
          y1="100"
          x2="240"
          y2="100"
          stroke="currentColor"
          strokeDasharray="4 4"
        />
        <text x="150" y="115" fontSize="12" textAnchor="middle" dy="4">
          d
        </text>
        <text
          x={pointAtTwoOclockWithOffset[0] + 150}
          y={pointAtTwoOclockWithOffset[1] + 100}
          fontSize="12"
          dy="4"
        >
          r
        </text>
      </motion.svg>
      <form
        onChange={(ev) => {
          const target = ev.target as HTMLInputElement;
          setAngleY(Number(target.value));
        }}
      >
        <input type="range" min="0" max="1" step="0.01" />
      </form>
    </>
  );
}

function circularCoordinates(radius: number, angle: number): [number, number] {
  const x = radius * Math.cos((angle * Math.PI) / 180);
  const y = radius * Math.sin((angle * Math.PI) / 180);
  return [x, y];
}

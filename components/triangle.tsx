"use client";
import * as d3 from "d3";
import { useMemo, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import * as React from "react";
import { Button } from "./ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import { AI } from "@/app/action";
import { useAIState } from "ai/rsc";
import { triangleDrawPrompt } from "@/app/ai-function-prompts";

type Props = z.infer<(typeof triangleDrawPrompt)["parameters"]>;

export function Triangle(props: Props) {
  const [points, setPoints] = useState(
    () =>
      props.points
        .split(" ")
        .map((point) => point.split(",").map(parseFloat)) as Vector2[]
  );

  const path = pointsToPath(points);

  return (
    <Interactions render={!isServer} params={{ ...props, points: path }}>
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
      >
        <polygon
          className="stroke fill-slate-400/10 stroke-slate-400"
          style={{
            strokeWidth: 1,
            fill: "#94a3b822",
            stroke: "currentcolor",
          }}
          points={path}
        />
        {Boolean(props.corners?.length) && (
          <CornerMarkings points={points} corners={props.corners} />
        )}
        {Boolean(props.angles?.length) && (
          <AngleArcs points={points} angles={props.angles} />
        )}
        {Boolean(props.sides?.length) && (
          <SideMarkings points={points} sides={props.sides} />
        )}
        {!isServer && (
          <DragPoints points={points} onUpdate={(p) => setPoints(p)} />
        )}
      </motion.svg>
    </Interactions>
  );
}

function CornerMarkings({
  points,
  corners,
}: {
  points: Vector2[];
  corners?: Props["corners"];
}) {
  return (
    <g>
      {points.map((_, i) => {
        const lastIndex = points.length - 1;
        const nextIndex = i === lastIndex ? 0 : i + 1;
        const prevIndex = i === 0 ? lastIndex : i - 1;
        const angleOne =
          Math.PI / 2 - getLineAngle(points[i], points[nextIndex]);
        const angleTwo =
          Math.PI / 2 - getLineAngle(points[i], points[prevIndex]);

        const averageAngle = averageAngles(angleOne, angleTwo);

        const [x, y] = movePoint(points[i], averageAngle, -12);
        const label = corners?.[i] || String.fromCharCode(65 + i);
        const showLabel = corners?.[i] !== null;

        if (!showLabel) return null;
        return (
          <text
            key={i}
            x={x}
            y={y}
            style={{
              fill: "#475569",
              fontSize: ".75rem",
              stroke: "none",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              userSelect: "none",
            }}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

function pointsToPath(points: Vector2[]): string {
  return points.map((point) => point.join(",")).join(" ");
}

function SideMarkings({
  points,
  sides,
}: {
  points: Vector2[];
  sides?: Props["sides"];
}) {
  const isClockwise = isDrawnClockwise(points);

  return (
    <g>
      {points.map((_, i) => {
        const lastIndex = points.length - 1;
        const nextIndex = i === lastIndex ? 0 : i + 1;
        const length = calculateDistance(points[i], points[nextIndex]);
        const angle = Math.PI / 2 - getLineAngle(points[i], points[nextIndex]);

        const pointOnLine = movePoint(points[i], angle, length / 2);
        const angleInDegrees = (angle * 180) / Math.PI;
        const angledUpside = angleInDegrees > 90 && angleInDegrees < 270;
        const [x, y] = movePoint(
          pointOnLine,
          angle - Math.PI / 2,
          isClockwise ? 12 : -12
        );

        const hasCustomLabel = typeof sides?.[i] === "string";
        const showLabel = sides?.[i] !== false;
        const label = hasCustomLabel
          ? (sides?.[i] as string)
          : length.toFixed(0);

        const transform =
          label.length > 1
            ? `rotate(${angledUpside ? angleInDegrees - 180 : angleInDegrees} ${x} ${y})`
            : "";

        if (!showLabel) return null;
        return (
          <text
            key={i}
            x={x}
            y={y}
            style={{
              fill: "#475569",
              fontSize: ".75rem",
              stroke: "none",
              fontWeight: 600,
              userSelect: "none",
            }}
            transform={transform}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

function Interactions({
  children,
  render,
  params = {},
}: {
  children: React.ReactNode;
  render: boolean;
  params?: Record<string, any>;
}) {
  const [hydrated, setHydrated] = useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!render || !hydrated) return children;
  return (
    <MotionConfig transition={spring.snappy}>
      <div className="relative inline-block group">
        {children}
        <Button
          size="icon"
          className="absolute bottom-0 right-0 hidden group-hover:flex"
          onClick={(ev) => {
            const queryParams = new URLSearchParams(params);
            if (ev.metaKey)
              return window.open(`/triangle.svg?${queryParams}`, "_blank");
            // const getBaseUrl = () =>
            //   `${window.location.protocol}//${window.location.host}`;
            const url = `/geometry/triangle.svg?${queryParams}`;
            const md = `![Image](${url})`;
            navigator.clipboard.writeText(md);
          }}
        >
          <CopyIcon />
        </Button>
      </div>
    </MotionConfig>
  );
}

function DragPoints({
  points,
  onUpdate,
}: {
  points: Vector2[];
  onUpdate?: (points: Vector2[]) => void;
}) {
  const refs = useRef<SVGGElement[]>([]);
  const initialPoints = useMemo(() => points, [points]);
  const id = React.useId();

  const [history, setHistory] = useAIState<typeof AI>();

  function updateAiHistory() {
    const newValue = pointsToPath(points);

    const info = {
      role: "system" as const,
      content: `[User has changed the shape points to "${newValue}"]`,
      id,
    };

    if (history[history.length - 1]?.id === id) {
      setHistory([...history.slice(0, -1), info]);
      return;
    }

    setHistory([...history, info]);
  }

  return initialPoints.map((point, i) => {
    const [x, y] = point;

    return (
      <motion.g
        key={i}
        dragMomentum={false}
        ref={(groupEl) => {
          if (!groupEl) return;
          refs.current[i] = groupEl;
        }}
        onPan={(_, info) => {
          const newPoints = [...points];
          newPoints[i] = [x + info.delta.x, y + info.delta.y];
          const padding = 20;
          newPoints[i][0] = Math.min(
            300 - padding,
            Math.max(padding, newPoints[i][0])
          );
          newPoints[i][1] = Math.min(
            200 - padding,
            Math.max(padding, newPoints[i][1])
          );
          onUpdate?.(newPoints);
          updateAiHistory();
        }}
        initial={{ opacity: 0, scale: 0 }}
        style={{
          originX: `${x}px`,
          originY: `${y}px`,
        }}
        variants={{
          containerHover: {
            opacity: 1,
            scale: 1,
          },
        }}
      >
        <motion.g whileHover="childHover">
          <motion.circle cx={x} cy={y} r={10} />
        </motion.g>
      </motion.g>
    );
  });
}

function AngleArcs({
  points,
  angles,
}: {
  points: Vector2[];
  angles?: Props["angles"];
}) {
  return points.map(([x, y], i) => {
    const lastIndex = points.length - 1;
    const rawAngle = calculateCornerAngle(
      points[i === 0 ? lastIndex : i - 1],
      points[i],
      points[i === lastIndex ? 0 : i + 1]
    );

    const rightAngle = rawAngle === 90;

    const outerRadius = rightAngle
      ? 30
      : d3.scaleLog().domain([20, 180]).range([70, 20])(rawAngle);

    const labelPos = rightAngle
      ? 17
      : d3.scaleLog().domain([20, 180]).range([55, 5])(rawAngle);

    const { startAngle, endAngle } = getAngles(
      points[i === 0 ? lastIndex : i - 1],
      points[i],
      points[i === lastIndex ? 0 : i + 1]
    );

    const arcPath = d3.arc()({
      innerRadius: outerRadius - 1,
      outerRadius,
      startAngle,
      endAngle,
    })!;

    const medianAngle = (startAngle + endAngle) / 2;
    const [labelX, labelY] = movePoint(
      points[i],
      medianAngle - Math.PI / 2,
      labelPos
    );

    const showLabel = angles?.[i] !== false;

    const angleLabel = Math.round(rawAngle) + "°";
    const showCustomLabel = typeof angles?.[i] === "string";
    const customLabel = angles?.[i] as string;

    const label = showCustomLabel ? customLabel : angleLabel;

    if (!showLabel) return null;
    return (
      <g key={i}>
        {rawAngle === 90 && !showCustomLabel ? (
          <circle
            cx={labelX}
            cy={labelY}
            r={2}
            style={{
              fill: "currentColor",
            }}
          />
        ) : (
          <text
            x={labelX}
            y={labelY}
            className="text-xs fill-slate-600 dark:fill-slate-200 uppercase font-bold tracking-tighter select-none"
            style={{
              fill: "#475569",
              fontSize: ".75rem",
              stroke: "none",
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "-0.05em",
            }}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {label}
          </text>
        )}
        <g transform={`translate(${x},${y})`}>
          <path
            d={arcPath}
            style={{
              fill: "currentColor",
            }}
          />
        </g>
      </g>
    );
  });
}

function movePoint(point: Vector2, angle: number, distance: number): Vector2 {
  // Calculate new position
  let x = point[0] + distance * Math.cos(angle);
  let y = point[1] + distance * Math.sin(angle);

  return [x, y] as Vector2;
}

function getAngles(
  A: Vector2,
  B: Vector2,
  C: Vector2
): { startAngle: number; endAngle: number } {
  let startAngle = Math.atan2(B[1] - A[1], B[0] - A[0]);
  let endAngle = Math.atan2(B[1] - C[1], B[0] - C[0]);

  if (startAngle < 0) startAngle += 2 * Math.PI;
  if (endAngle < 0) endAngle += 2 * Math.PI;

  if (startAngle > endAngle) {
    [startAngle, endAngle] = [endAngle, startAngle];
  }

  startAngle = startAngle -= Math.PI / 2;
  endAngle = endAngle -= Math.PI / 2;

  if (startAngle < 0) startAngle += 2 * Math.PI;

  if (Math.abs(startAngle - endAngle) > Math.PI) {
    if (endAngle > startAngle) startAngle += 2 * Math.PI;
    else endAngle += 2 * Math.PI;
  }

  return { startAngle, endAngle };
}

function getLineLengths(points: Vector2[]): number[] {
  let lengths = [];
  for (let i = 0; i < points.length; i++) {
    // get next index (loop to start for final point)
    const nextIndex = i === points.length - 1 ? 0 : i + 1;
    lengths.push(calculateDistance(points[i], points[nextIndex]));
  }
  return lengths;
}

function calculateDistance(pt1: Vector2, pt2: Vector2) {
  return Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
}

function getStartAngle(p1: Vector2, p2: Vector2, p3: Vector2): number {
  let theta = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  let theta2 = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);
  let angle = theta2 - theta;
  if (angle < 0) angle = 360 + angle;
  return angle;
}

function calculateCornerAngle(p1: Vector2, p2: Vector2, p3: Vector2): number {
  // Create vectors from point p2 to p1 and p3
  let vectorP2P1 = [p1[0] - p2[0], p1[1] - p2[1]];
  let vectorP2P3 = [p3[0] - p2[0], p3[1] - p2[1]];

  // Compute the dot product of the two vectors
  let dotProduct =
    vectorP2P1[0] * vectorP2P3[0] + vectorP2P1[1] * vectorP2P3[1];

  // Compute the cross product of the two vectors
  let crossProduct =
    vectorP2P1[1] * vectorP2P3[0] - vectorP2P1[0] * vectorP2P3[1];

  // Calculate the angle and convert it to degrees
  let angle = Math.atan2(crossProduct, dotProduct) * (180 / Math.PI);

  // If angle is negative, add 360 to get the positive equivalent
  if (angle < 0) angle += 360;
  if (angle > 180) angle = 360 - angle;

  return angle;
}

function getLineAngle(p1: Vector2, p2: Vector2): number {
  return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
}

function averageAngles(theta1: number, theta2: number): number {
  // Convert angles to vectors
  const x1 = Math.cos(theta1);
  const y1 = Math.sin(theta1);
  const x2 = Math.cos(theta2);
  const y2 = Math.sin(theta2);

  // Average the vectors
  const xAvg = (x1 + x2) / 2;
  const yAvg = (y1 + y2) / 2;

  // Convert the average vector back to an angle
  const thetaAvg = Math.atan2(yAvg, xAvg);

  return thetaAvg;
}

function findPointAtAngleAndDistance(
  centroid: Vector2,
  angle: number,
  distance: number
): Vector2 {
  return [
    centroid[0] + distance * Math.cos(angle),
    centroid[1] + distance * Math.sin(angle),
  ];
}

function calculateSignedArea(points: number[][]): number {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }

  return area / 2;
}

function isDrawnClockwise(points: number[][]) {
  const area = calculateSignedArea(points);
  return area! > 0;
}

function getCentroid(...arr: Vector2[]): Vector2 {
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < arr.length; i++) {
    sumX += arr[i][0];
    sumY += arr[i][1];
  }

  let centroidX = sumX / arr.length;
  let centroidY = sumY / arr.length;

  return [centroidX, centroidY];
}

const spring = {
  snappy: { type: "spring", stiffness: 2000, damping: 40, mass: 0.01 },
  bouncy: { type: "spring", stiffness: 650, damping: 30, mass: 1 },
  smooth: { type: "spring", stiffness: 550, damping: 32, mass: 0.05 },
};

const isServer = typeof window === "undefined";
type Vector2 = [number, number];

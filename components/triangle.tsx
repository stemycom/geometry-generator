"use client";
import * as d3 from "d3";
import { useMemo, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import * as React from "react";
import { Button } from "./ui/button";
import { CopyIcon } from "@radix-ui/react-icons";

export function Triangle(props: {
  points: string;
  corners?: (string | null | undefined)[];
}) {
  const [points, setPoints] = useState(
    () =>
      props.points
        .split(" ")
        .map((point) => point.split(",").map(parseFloat)) as Vector2[]
  );

  const pointsPolygonString = points.map((point) => point.join(",")).join(" ");

  return (
    <Interactions
      render={!isServer}
      params={{ ...props, points: pointsPolygonString }}
    >
      <motion.svg
        whileHover="containerHover"
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
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
            strokeWidth: 2,
            fill: "#94a3b833",
            stroke: "#94a3b8",
          }}
          points={pointsPolygonString}
        />
        <AngleArcs points={points} angles={props.corners} />
        <DragPoints points={points} onUpdate={setPoints} />
      </motion.svg>
    </Interactions>
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
            //copy to clipboard
            const queryParams = new URLSearchParams(params);
            if (ev.metaKey)
              return window.open(`/triangle.svg?${queryParams}`, "_blank");
            const getBaseUrl = () =>
              `${window.location.protocol}//${window.location.host}`;
            const url = `${getBaseUrl()}/triangle.svg?${queryParams}`;
            const md = `![Image](${url} "Kolmnurk")`;
            navigator.clipboard.writeText(md);
          }}
        >
          <CopyIcon />
        </Button>
      </div>
    </MotionConfig>
  );
}

function ConditionalWrapper({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}) {
  return condition ? wrapper(children) : children;
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
          onUpdate?.(newPoints);
        }}
        initial={{ scale: 1, opacity: 0 }}
        variants={{
          containerHover: {
            scale: 1,
            opacity: 1,
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
  angles?: (string | null | undefined)[];
}) {
  return points.map(([x, y], i) => {
    const lastIndex = points.length - 1;
    const rawAngle = calculateCornerAngle(
      points[i === 0 ? lastIndex : i - 1],
      points[i],
      points[i === lastIndex ? 0 : i + 1]
    );

    const outerRadius = d3.scaleLog().domain([20, 180]).range([70, 20])(
      rawAngle
    );

    const labelPos = d3.scaleLog().domain([20, 180]).range([55, 5])(rawAngle);

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

    const hasLabel = angles?.[i] !== undefined;
    const angleLabel = Math.round(rawAngle) + "°";
    const label = angles?.[i] || angleLabel;
    return (
      <g key={i}>
        {rawAngle === 90 && !hasLabel ? (
          <circle
            cx={labelX}
            cy={labelY}
            r={2}
            style={{
              fill: "#94a3b8",
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
              fill: "#94a3b8",
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
  let theta = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  // theta *= 180 / Math.PI;
  // if (theta < 0) theta = 360 + theta;
  return theta;
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

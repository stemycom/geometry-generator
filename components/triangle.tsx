"use client";
import * as d3 from "d3";
import { useMemo, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";

type Vector2 = [number, number];

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
    <MotionConfig transition={spring.snappy}>
      <div>
        <motion.svg
          whileHover="containerHover"
          className="text-green-400"
          viewBox="0 0 300 200"
          width="300"
          height="200"
        >
          <polygon
            className="stroke fill-slate-400/10 stroke-slate-400"
            points={pointsPolygonString}
          />
          <AngleArcs points={points} angles={props.corners} />
          <DragPoints points={points} onUpdate={setPoints} />
        </motion.svg>
        {/* <input
          className="w-full mt-8"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        /> */}
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

  return initialPoints.map((point, i) => {
    const [x, y] = point;
    const transformOrigin = `${x}px ${y}px`;

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
        initial={{ scale: 0.5, opacity: 0 }}
        variants={{
          containerHover: {
            scale: 1,
            opacity: 1,
          },
        }}
      >
        <motion.g whileHover="childHover">
          <motion.circle cx={x} cy={y} r={10} className="fill-blue-500/20" />
          <motion.circle
            cx={x}
            cy={y}
            r={10}
            whileHover={{ scale: 1.5 }}
            className="fill-blue-500"
          />
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
          <circle cx={labelX} cy={labelY} r={2} className="fill-slate-400" />
        ) : (
          <text
            x={labelX}
            y={labelY}
            className="text-xs fill-slate-600 dark:fill-slate-200 uppercase font-bold tracking-tighter select-none"
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {label}
          </text>
        )}
        <g transform={`translate(${x},${y})`}>
          <path d={arcPath} className="fill-slate-400" />
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

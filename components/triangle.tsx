import * as d3 from "d3";

type Vector2 = [number, number];

export function Triangle({ points }: { points: string; angles?: string }) {
  const pointsArray = points
    .split(" ")
    .map((point) => point.split(",").map(parseFloat)) as Vector2[];

  return (
    <svg
      className="text-green-400"
      viewBox="0 0 300 200"
      width="300"
      height="200"
    >
      <polygon
        className="stroke stroke-2 fill-red-400/20 stroke-red-400"
        points={points}
      />
      <AngleArcs points={pointsArray} />
    </svg>
  );
}

function AngleArcs({ points }: { points: Vector2[] }) {
  return points.map(([x, y], i) => {
    const lastIndex = points.length - 1;
    const rawAngle = calculateCornerAngle(
      points[i === 0 ? lastIndex : i - 1],
      points[i],
      points[i === lastIndex ? 0 : i + 1]
    );

    const outerRadius = d3.scaleLinear().domain([0, 180]).range([60, 10])(
      rawAngle
    );

    const { startAngle, endAngle } = getAngles(
      points[i === 0 ? lastIndex : i - 1],
      points[i],
      points[i === lastIndex ? 0 : i + 1]
    );

    const arcPath = d3.arc()({
      innerRadius: outerRadius - 2,
      outerRadius,
      startAngle,
      endAngle,
    })!;

    const labelPos = d3.scalePow().domain([0, 180]).range([40, 2])(rawAngle);

    const medianAngle = (startAngle + endAngle) / 2;
    const [labelX, labelY] = movePoint(
      points[i],
      medianAngle - Math.PI / 2,
      labelPos
    );

    const angleLabel = Math.round(rawAngle) + "°";
    return (
      <g key={i}>
        {rawAngle === 90 ? (
          <circle cx={labelX} cy={labelY} r={3} className="fill-red-400" />
        ) : (
          <text
            x={labelX}
            y={labelY}
            className="text-xs fill-white"
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {angleLabel}
          </text>
        )}
        <g transform={`translate(${x},${y})`}>
          <path d={arcPath} className="fill-red-400" />
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

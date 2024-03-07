type Point = { x: number; y: number };

export function Triangle({
  points = "100,50 100,150 200,150",
}: {
  points?: string;
}) {
  const pointsArray = points
    .split(" ")
    .map((point) => point.split(",").map(parseFloat));

  const midPoints = [
    getCentroid(
      { x: pointsArray[0][0], y: pointsArray[0][1] },
      { x: pointsArray[1][0], y: pointsArray[1][1] }
    ),
    getCentroid(
      { x: pointsArray[1][0], y: pointsArray[1][1] },
      { x: pointsArray[2][0], y: pointsArray[2][1] }
    ),
    getCentroid(
      { x: pointsArray[2][0], y: pointsArray[2][1] },
      { x: pointsArray[0][0], y: pointsArray[0][1] }
    ),
  ];

  const midPointAngles = [
    getLineAngle(
      { x: pointsArray[0][0], y: pointsArray[0][1] },
      { x: pointsArray[1][0], y: pointsArray[1][1] }
    ),
    getLineAngle(
      { x: pointsArray[1][0], y: pointsArray[1][1] },
      { x: pointsArray[2][0], y: pointsArray[2][1] }
    ),
    getLineAngle(
      { x: pointsArray[2][0], y: pointsArray[2][1] },
      { x: pointsArray[0][0], y: pointsArray[0][1] }
    ),
  ];

  const angles = [
    calculateCornerAngle(
      { x: pointsArray[1][0], y: pointsArray[1][1] },
      { x: pointsArray[2][0], y: pointsArray[2][1] },
      { x: pointsArray[0][0], y: pointsArray[0][1] }
    ),
    calculateCornerAngle(
      { x: pointsArray[0][0], y: pointsArray[0][1] },
      { x: pointsArray[1][0], y: pointsArray[1][1] },
      { x: pointsArray[2][0], y: pointsArray[2][1] }
    ),
    calculateCornerAngle(
      { x: pointsArray[2][0], y: pointsArray[2][1] },
      { x: pointsArray[0][0], y: pointsArray[0][1] },
      { x: pointsArray[1][0], y: pointsArray[1][1] }
    ),
  ];

  return (
    <svg viewBox="0 0 300 200" width="300" height="200">
      <polygon
        points={points}
        className="stroke stroke-2 stroke-slate-500 fill-none"
      />
      {pointsArray.map(([x, y], i) => {
        const angle = Math.round(angles[i] * 10) / 10;

        return (
          <>
            <circle key={i} cx={x} cy={y} r="2" className="fill-slate-500" />
            <text
              x={x}
              y={y}
              className="text-xs fill-slate-500"
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {angle}
            </text>
          </>
        );
      })}
      {midPoints.map((point, i) => {
        const textPos = findPointAtAngleAndDistance(
          point,
          midPointAngles[i] + Math.PI / 2,
          16
        );

        return (
          <>
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="2"
              className="fill-slate-500"
            />
            <text
              x={textPos.x}
              y={textPos.y}
              className="text-xs fill-slate-500"
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {i === 0 ? "A" : i === 1 ? "B" : "C"}
            </text>
          </>
        );
      })}
    </svg>
  );
}

function calculateCornerAngle(p1: Point, p2: Point, p3: Point): number {
  // Create vectors from point p2 to p1 and p3
  let vectorP2P1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  let vectorP2P3 = { x: p3.x - p2.x, y: p3.y - p2.y };

  // Compute the dot product of the two vectors
  let dotProduct = vectorP2P1.x * vectorP2P3.x + vectorP2P1.y * vectorP2P3.y;

  // Compute the cross product of the two vectors
  let crossProduct = vectorP2P1.y * vectorP2P3.x - vectorP2P1.x * vectorP2P3.y;

  // Calculate the angle and convert it to degrees
  let angle = Math.atan2(crossProduct, dotProduct) * (180 / Math.PI);

  // If angle is negative, add 360 to get the positive equivalent
  if (angle < 0) angle += 360;
  if (angle > 180) angle = 360 - angle;

  return angle;
}

function getLineAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function findPointAtAngleAndDistance(
  centroid: Point,
  angle: number,
  distance: number
): Point {
  return {
    x: centroid.x + distance * Math.cos(angle),
    y: centroid.y + distance * Math.sin(angle),
  };
}

function getCentroid(...arr: Point[]): Point {
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < arr.length; i++) {
    sumX += arr[i].x;
    sumY += arr[i].y;
  }

  let centroidX = sumX / arr.length;
  let centroidY = sumY / arr.length;

  return { x: centroidX, y: centroidY };
}

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

  const center = getCentroid(
    { x: pointsArray[0][0], y: pointsArray[0][1] },
    { x: pointsArray[1][0], y: pointsArray[1][1] },
    { x: pointsArray[2][0], y: pointsArray[2][1] }
  );

  return (
    <svg viewBox="0 0 300 200" width="300" height="200">
      <polygon
        points={points}
        className="stroke stroke-2 stroke-slate-500 fill-none"
      />
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

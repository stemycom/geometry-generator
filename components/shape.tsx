export function Shape({
  points = "100,50 100,150 200,150",
  point,
}: {
  points?: string;
  point?: [number, number];
}) {
  return (
    <svg viewBox="0 0 300 200" width="300" height="200">
      <polygon
        points={points}
        className="stroke stroke-2 stroke-slate-500 fill-none"
      />
      {point && (
        <circle cx={point[0]} cy={point[1]} r={3} className="fill-primary" />
      )}
    </svg>
  );
}

import * as THREE from "three";

const size = { width: 300, height: 200 };

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
camera.zoom = 200;

const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.rotateY(0.5);
geometry.rotateX(0.5);

const cube = new THREE.Mesh(geometry);
scene.add(cube);

const positionAttr = cube.geometry.attributes.position;

const vertex = new THREE.Vector3();

const vertPositions: Point[] = [];
for (let i = 0; i < positionAttr.count; i++) {
  vertex.fromBufferAttribute(positionAttr, i);

  vertex.applyMatrix4(cube.matrixWorld);
  vertex.project(camera);

  const x = vertex.x * 0.5 * size.height;
  const y = -vertex.y * 0.5 * size.height;

  vertPositions.push({ x, y });
}

function Cube() {
  const path = vertPositions.map(({ x, y }) => `${x},${y}`).join(" ");
  const length = 6;

  return (
    <g>
      {/* <path d={`M${path}Z`} fill="none" stroke="black" /> */}
      {Array.from({ length }, (_, i) => {
        const [p1, p2, p3, p4] = vertPositions.slice(i * 4, i * 4 + 4);
        const points = [p1, p2, p4, p3].map((v) => `${v.x},${v.y}`).join(" ");

        const normal = new THREE.Vector3();
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();

        const index = i * 4;
        a.fromBufferAttribute(cube.geometry.attributes.position, index);
        b.fromBufferAttribute(cube.geometry.attributes.position, index + 1);
        c.fromBufferAttribute(cube.geometry.attributes.position, index + 2);

        normal.crossVectors(b.sub(a), c.sub(a)).normalize();
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const dot = normal.dot(cameraDirection);
        const flipped = dot < 0;

        return (
          <polygon
            key={i}
            points={points}
            fill={flipped ? "rgba(148, 163, 184, 0.10)" : "rgba(0,0,0,0)"}
            stroke={flipped ? "#94a3b822" : "#94a3b8"}
          />
        );
      })}
      {vertPositions.map(({ x, y }, i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="red" />
      ))}
    </g>
  );
}

export default function Page() {
  return (
    <div className="w-full max-w-96 aspect-square bg-white">
      <svg
        viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
      >
        <Cube />
      </svg>
      <pre className="text-xs">{JSON.stringify(vertPositions, null, 2)}</pre>
    </div>
  );
}

type Point = { x: number; y: number };

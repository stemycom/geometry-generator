"use client";

import { OrbitControls } from "@react-three/drei";
import { Camera, Canvas, RootState, useFrame } from "@react-three/fiber";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { SVGRenderer } from "three-stdlib";

const size = { width: 200, height: 200 };

function Shape({
  onUpdate,
}: {
  onUpdate: (arg: { state: RootState; mesh: THREE.Mesh }) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => onUpdate({ state, mesh: meshRef.current! }));

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial opacity={0.1} />
    </mesh>
  );
}

export default function Page() {
  return (
    <div className="w-full max-w-96 aspect-square bg-white">
      <Geometry />
    </div>
  );
}

import { createContext } from "react";
import { MotionValue, useMotionValue } from "framer-motion";

const CanvasContext = createContext<{ cuboid: MotionValue<Point[]> }>({
  cuboid: new MotionValue(),
});

function Geometry({ size = { width: 300, height: 200 } }) {
  const [hydrated, setHydrated] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null!);
  const initialVertices = getInitialVertices();
  const vertices = useMotionValue(initialVertices);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <CanvasContext.Provider value={{ cuboid: vertices }}>
      {hydrated && (
        <Canvas
          style={{ display: !hydrated ? "none" : "block" }}
          orthographic
          camera={{ position: [1, 1, 1.5], zoom: 200 }}
          frameloop="demand"
          gl={(canvas) => {
            const gl = new SVGRenderer();
            gl.domElement = svgRef.current;
            //@ts-ignore
            const parent = canvas.parentNode;
            parent.removeChild(canvas);
            parent.appendChild(gl.domElement);
            return gl;
          }}
        >
          <OrbitControls />
          <Shape
            onUpdate={({ state: { camera }, mesh }) => {
              console.log({ ...camera });
              const verts = getVertPositions({ camera, mesh });
              vertices.set(verts);
            }}
          />
        </Canvas>
      )}
      <svg
        ref={svgRef}
        className="w-full max-w-96 aspect-square bg-white [grid-area:1/1]"
        viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
      >
        <Wireframe />
      </svg>
    </CanvasContext.Provider>
  );
}

function Wireframe() {
  const vertices = useVertices();
  const polylineRef = useRef<SVGPolylineElement>(null!);

  useEffect(() => {
    vertices.cuboid.on("change", () => {
      const verts = vertices.cuboid.get();
      polylineRef.current.setAttribute(
        "points",
        verts.map(({ x, y }) => `${x},${y}`).join(" ")
      );
    });
  });

  const points = vertices.cuboid
    .get()
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  return (
    <polyline points={points} ref={polylineRef} fill="none" stroke="black" />
  );
}

function getInitialVertices() {
  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -192, // left
    192, // right
    192, // top
    -192, // bottom
    1,
    1000
  );

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geometry);
  scene.add(mesh);

  camera.position.set(1, 1, 1.5);
  camera.lookAt(0, 0, 0);
  camera.updateWorldMatrix(true, true);

  camera.zoom = 200;
  camera.updateProjectionMatrix();
  console.log("initial", { ...camera });

  return getVertPositions({ mesh, camera });
}

function getVertPositions({
  mesh,
  camera,
}: {
  mesh: THREE.Mesh;
  camera: Camera;
}): Point[] {
  const vertPositions: Point[] = [];
  const positionAttr = mesh.geometry.attributes.position;

  const vertex = new THREE.Vector3();

  for (let i = 0; i < positionAttr.count; i++) {
    vertex.fromBufferAttribute(positionAttr, i);

    vertex.applyMatrix4(mesh.matrixWorld);
    vertex.project(camera);

    const x = vertex.x * 0.5 * size.height;
    const y = -vertex.y * 0.5 * size.height;

    vertPositions.push({ x, y });
  }
  return vertPositions;
}

const useVertices = () => {
  const vertices = useContext(CanvasContext);
  return vertices;
};

type Point = { x: number; y: number };

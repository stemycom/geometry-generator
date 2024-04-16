"use client";

import { Camera, Canvas, RootState, useFrame } from "@react-three/fiber";
import {
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { SVGRenderer } from "three-stdlib";
import { motion } from "framer-motion";
import { createContext } from "react";
import { MotionValue, useMotionValue } from "framer-motion";
import { OrbitControls } from "@react-three/drei";

export default function Page() {
  return (
    <div className="w-full max-w-96 aspect-square bg-white">
      <Geometry />
    </div>
  );
}

const size = { width: 200, height: 200 };

const Shape = forwardRef<
  THREE.Mesh,
  {
    onUpdate: (arg: { state: RootState }) => void;
  }
>(({ onUpdate }, meshRef) => {
  useFrame((state) => {
    onUpdate({ state });
    // if (!meshRef) return;
    // //@ts-ignore
    // const mesh = meshRef.current as THREE.Mesh;
  }, 1);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
});

const CanvasContext = createContext<{
  setOrbitControllerProps: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
    }>
  >;
  cuboid: {
    vertices: MotionValue<Point[]>;
    mesh: React.MutableRefObject<THREE.Mesh>;
  };
}>(null!);

function Geometry({ size = { width: 300, height: 200 } }) {
  const [hydrated, setHydrated] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null!);
  const initialVertices = getInitialVertices();
  const vertices = useMotionValue(initialVertices);
  const meshRef = useRef<THREE.Mesh>(null!);

  const [orbitControllerProps, setOrbitControllerProps] = useState({
    enabled: true,
  });

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <CanvasContext.Provider
      value={{ cuboid: { vertices, mesh: meshRef }, setOrbitControllerProps }}
    >
      {hydrated && (
        <Canvas
          style={{ display: !hydrated ? "none" : "block" }}
          orthographic
          camera={{ position: [1, 1, 1.5], zoom: 200 }}
          //frameloop="demand"
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
          <OrbitControls {...orbitControllerProps} />
          <Shape
            ref={meshRef}
            onUpdate={({ state: { camera } }) => {
              const verts = getVertPositions({ camera, mesh: meshRef.current });
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
  const { cuboid, setOrbitControllerProps } = useGeometry();
  const polylineRef = useRef<SVGPolylineElement>(null!);
  const xScaleElRef = useRef<SVGCircleElement>(null!);
  const zScaleElRef = useRef<SVGCircleElement>(null!);

  useEffect(() => {
    cuboid.vertices.on("change", (verts) => {
      polylineRef.current.setAttribute(
        "points",
        verts.map(({ x, y }) => `${x},${y}`).join(" ")
      );
      if (!xScaleElRef.current || !zScaleElRef.current) return;
      const xPoint = getCentroid(verts[2], verts[3]);
      xScaleElRef.current.setAttribute("cx", xPoint.x.toString());
      xScaleElRef.current.setAttribute("cy", xPoint.y.toString());
      const zPoint = getCentroid(verts[2], verts[7]);
      zScaleElRef.current.setAttribute("cx", zPoint.x.toString());
      zScaleElRef.current.setAttribute("cy", zPoint.y.toString());
    });
  });

  const points = cuboid.vertices
    .get()
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  const enable = () => setOrbitControllerProps({ enabled: true });
  const disable = () => setOrbitControllerProps({ enabled: false });

  return (
    <>
      <polyline points={points} ref={polylineRef} fill="none" stroke="black" />
      <motion.circle
        ref={xScaleElRef}
        dragMomentum
        onPointerEnter={disable}
        onPointerLeave={enable}
        onPan={(_, info) => {
          const scaleX = info.offset.x / 100;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(1 + scaleX, 1, 1);
        }}
        r={5}
        fill="red"
      />
      <motion.circle
        ref={zScaleElRef}
        dragMomentum
        onPointerEnter={disable}
        onPointerLeave={enable}
        onPan={(_, info) => {
          const scaleY = info.offset.y / 100;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(1, 1, 1 + scaleY);
        }}
        r={5}
        fill="red"
      />
    </>
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

const useGeometry = () => {
  const vertices = useContext(CanvasContext);
  return vertices;
};

type Point = { x: number; y: number };

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

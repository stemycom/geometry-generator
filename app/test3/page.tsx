"use client";

import { Camera, Canvas, RootState, useFrame } from "@react-three/fiber";
import {
  MutableRefObject,
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
import { cuboidDrawPrompt } from "../ai-function-prompts";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";

const size = { width: 300, height: 200 };
const defaultZoom = 130;
const defaultRotation = [1, 1, 1.5];

interface CameraState {
  rotation?: number[];
  zoom?: number;
}
type CuboidInput = z.infer<(typeof cuboidDrawPrompt)["parameters"]>;
type Props = CuboidInput &
  CameraState & {
    onCameraChange?: (cam: CameraState) => void;
  };
type CuboidState = CuboidInput & CameraState;

export default function Page() {
  const params = useRef<CuboidState>({
    size: [2, 1],
    diagonals: ["body"],
    corners: ["1", "2", "3", "4", "5", "6", "7", "8"],
    sides: ["x", "y", true],
  });
  const [copyLabel, setCopyLabel] = useState(false);

  useEffect(() => {
    if (!copyLabel) return;
    const timeout = setTimeout(() => {
      setCopyLabel(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [copyLabel]);

  return (
    <div className="max-w-96 group relative">
      <Cuboid
        {...params.current}
        onCameraChange={(cam) => {
          params.current = { ...params.current, ...cam };
        }}
      />
      <Button
        size="sm"
        className="absolute bottom-0 right-0 hidden group-hover:flex"
        disabled={copyLabel}
        onClick={(ev) => {
          const queryParams = new URLSearchParams(params.current as any);
          setCopyLabel(true);
          if (ev.metaKey)
            return window.open(`/cuboid.svg?${queryParams}`, "_blank");
          const url = `/geometry/cuboid.svg?${queryParams}`;
          const md = `![Image](${url})`;
          navigator.clipboard.writeText(md);
        }}
      >
        {!copyLabel ? <CopyIcon /> : "Copied!"}
      </Button>
    </div>
  );
}

let logged = false;
const Shape = forwardRef<
  THREE.Mesh,
  {
    size: Props["size"];
    onUpdate: (arg: { state: RootState }) => void;
  }
>(({ onUpdate, size }, meshRef) => {
  useFrame((state) => {
    onUpdate({ state });
    if (!logged) {
      console.log(state);
      logged = true;
    }
  }, 1);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size[0], 1, size[1]]} />
    </mesh>
  );
});

const CanvasContext = createContext<{
  setOrbitControllerProps: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
    }>
  >;
  cameraRef: MutableRefObject<Camera>;
  cuboid: {
    vertices: MotionValue<Point[]>;
    mesh: React.MutableRefObject<THREE.Mesh>;
  };
}>(null!);

export function Cuboid(props: Props) {
  const [hydrated, setHydrated] = useState(false);

  const initialScene = createInitialScene(props);
  const initialVertices = getVertPositions(initialScene);

  const svgRef = useRef<SVGSVGElement>(null!);
  const vertices = useMotionValue(initialVertices);
  const meshRef = useRef<THREE.Mesh>(initialScene.mesh);
  const cameraRef = useRef<Camera>(initialScene.camera);

  const [orbitControllerProps, setOrbitControllerProps] = useState({
    enabled: true,
  });

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  const firstUpdate = useRef(true);

  return (
    <CanvasContext.Provider
      value={{
        cameraRef,
        cuboid: { vertices, mesh: meshRef },
        setOrbitControllerProps,
      }}
    >
      {hydrated && (
        <Canvas
          orthographic
          style={{ display: !hydrated ? "none" : "block" }}
          camera={{
            position:
              (props.rotation as [number, number, number]) ?? defaultRotation,
            zoom: props.zoom ?? defaultZoom,
          }}
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
          <OrbitControls
            {...orbitControllerProps}
            zoomSpeed={0.4}
            onChange={(ev) => {
              if (!ev) return;
              const camera = ev.target.object;
              const pos = camera.position;
              //@ts-ignore
              const zoom = camera.zoom;
              props.onCameraChange?.({
                rotation: pos.toArray().map((v) => +v.toFixed(3)),
                zoom: Math.floor(zoom),
              });
            }}
          />
          <Shape
            ref={meshRef}
            size={props.size}
            onUpdate={({ state: { camera } }) => {
              if (firstUpdate.current) {
                firstUpdate.current = false;
                cameraRef.current = camera;
              }
              const verts = getVertPositions({ camera, mesh: meshRef.current });
              vertices.set(verts);
            }}
          />
        </Canvas>
      )}
      <motion.svg
        ref={svgRef}
        className="w-full bg-white [grid-area:1/1] outline-none cursor-grab active:cursor-grabbing"
        whileHover="containerHover"
        whileTap="containerHover"
        style={{
          userSelect: "none",
          //@ts-ignore
          "-webkit-user-select": "none",
          fontFamily:
            "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          color: "#94a3b8",
        }}
        viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <Diagonals types={props.diagonals} />
        {/* <Wireframe /> */}
        <Faces />
        <CornerVerts corners={props.corners} />
        <Gizmos size={props.size} />
        <Sides sides={props.sides} />
      </motion.svg>
    </CanvasContext.Provider>
  );
}

function Sides({ sides }: { sides: Props["sides"] }) {
  const sidesRef = useRef<SVGPolylineElement[]>([]);
  const labelRefs = useRef<SVGTextElement[]>([]);
  const { cuboid } = useGeometry();

  cuboid.vertices.on("change", updateSides);

  function updateSides() {
    const sides = getIndexes().map(calculateSides);
    sides.forEach((props, i) => {
      const side = sidesRef.current[i];
      side.setAttribute("points", props.points);

      const label = labelRefs.current[i];
      label.setAttribute("x", props.x.toString());
      label.setAttribute("y", props.y.toString());
      label.setAttribute("transform", props.transform);
      label.setAttribute("text-anchor", props.textAnchor);
      label.textContent = props.label;
    });
  }

  function getIndexes() {
    return [
      [7, 2],
      [2, 3],
      [1, 3],
    ] as [number, number][];
  }

  function calculateSides(indexes: [number, number], sideIndex: number) {
    const offset = 15;
    const verts = cuboid.vertices.get();
    const a = verts[indexes[0]];
    const b = verts[indexes[1]];
    const center = getCentroid(...verts);

    const offsetPoints = [a, b].map((p) => {
      // Calculate the direction vector components from center to the point
      const dirX = p.x - center.x;
      const dirY = p.y - center.y;

      // Calculate the magnitude (length) of the direction vector
      const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

      // Normalize the direction vector
      const normX = dirX / magnitude;
      const normY = dirY / magnitude;

      // Calculate the new points by moving the vertex along the normalized direction by the offset
      const x = p.x + normX * offset;
      const y = p.y + normY * offset;

      // Calculate the angle of the direction vector

      return { x, y };
    });

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleInDegrees = (angle * 180) / Math.PI;

    const { x, y } = getCentroid(...offsetPoints);

    const distance = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

    const points = offsetPoints.map(({ x, y }) => `${x},${y}`).join(" ");

    const geometry = cuboid.mesh.current.geometry as THREE.BoxGeometry;
    const { width, depth } = geometry.parameters;

    let label: string;
    if (sides?.[sideIndex] === true) {
      label = ([depth, width, 1][sideIndex] * 10).toFixed(0) + " cm";
    } else if (typeof sides?.[sideIndex] === "string") {
      label = sides[sideIndex] as string;
    } else {
      label = "";
    }

    const small = distance < 45 || label.length < 2;
    const textAnchor = small ? "start" : "middle";

    const transform = small
      ? "translate(0, 0)"
      : `rotate(${angleInDegrees} ${x} ${y})`;

    return { points, transform, x, y, textAnchor, label };
  }

  return getIndexes()
    .map(calculateSides)
    .map(({ points, transform, x, y, textAnchor, label }, i) => {
      return (
        <>
          <polyline
            ref={(el) => {
              sidesRef.current[i] = el!;
            }}
            key={i}
            points={points}
            fill="none"
            // stroke="rgba(255, 0, 0, 0.25)"
          />
          <text
            ref={(el) => {
              labelRefs.current[i] = el!;
            }}
            x={x}
            y={y}
            transform={transform}
            dominantBaseline="middle"
            textAnchor={textAnchor}
            style={{
              fill: "#475569",
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            {label}
          </text>
        </>
      );
    });
}

function Diagonals({ types }: { types: Props["diagonals"] }) {
  const { cuboid, cameraRef } = useGeometry();
  const polylinesRef = useRef<SVGPolylineElement[]>([]);

  cuboid.vertices.on("change", (verts) => {
    getIndexes(types)
      .map((indexes) => calculateDiagonals(verts, indexes))
      .map((diagonals, i) => {
        if (!polylinesRef.current[i]) return;
        const polyline = polylinesRef.current[i];
        polyline.setAttribute("points", diagonals.points);
        polyline.setAttribute("stroke-dasharray", diagonals.strokeDasharray);
      });
  });

  function calculateDiagonals(verts: Point[], indexes: [number, number]) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();

    a.fromBufferAttribute(
      cuboid.mesh.current.geometry.attributes.position,
      indexes[0]
    );
    b.fromBufferAttribute(
      cuboid.mesh.current.geometry.attributes.position,
      indexes[1]
    );

    a.applyMatrix4(cuboid.mesh.current.matrixWorld);
    b.applyMatrix4(cuboid.mesh.current.matrixWorld);

    const camera = cameraRef.current;

    a.project(camera);
    b.project(camera);

    const distance = a.distanceTo(b);

    const points = [verts[indexes[0]], verts[indexes[1]]]
      .map(({ x, y }) => `${x},${y}`)
      .join(" ");
    return {
      points,
      strokeDasharray: `${distance * 3} ${distance * 2}`,
    };
  }

  function getIndexes(types: Props["diagonals"]): [number, number][] {
    if (!types) return [];
    return types.map((type) => {
      switch (type) {
        case "base":
          return [7, 3];
        case "front":
          return [7, 0];
        case "body":
          return [7, 1];
      }
    });
  }

  return getIndexes(types)
    .map((indexes) => calculateDiagonals(cuboid.vertices.get(), indexes))
    .map(({ points, strokeDasharray }, i) => (
      <polyline
        key={i}
        ref={(el) => {
          polylinesRef.current[i] = el!;
        }}
        points={points}
        strokeDasharray={strokeDasharray}
        fill="none"
        stroke="#94a3b8"
      />
    ));
}

function Gizmos({ size }: { size: Props["size"] }) {
  const { cuboid, setOrbitControllerProps } = useGeometry();
  const xScaleElRef = useRef<SVGCircleElement>(null!);
  const zScaleElRef = useRef<SVGCircleElement>(null!);

  const xOriginX = useMotionValue("");
  const xOriginY = useMotionValue("");

  const zOriginX = useMotionValue("");
  const zOriginY = useMotionValue("");

  useEffect(() => {
    cuboid.vertices.on("change", (verts) => {
      if (!xScaleElRef.current || !zScaleElRef.current) return;
      const xPoint = getCentroid(verts[2], verts[3]);
      xScaleElRef.current.setAttribute("cx", xPoint.x.toString());
      xScaleElRef.current.setAttribute("cy", xPoint.y.toString());
      const zPoint = getCentroid(verts[2], verts[7]);
      zScaleElRef.current.setAttribute("cx", zPoint.x.toString());
      zScaleElRef.current.setAttribute("cy", zPoint.y.toString());

      xOriginX.set(`${xPoint.x}px`);
      xOriginY.set(`${xPoint.y}px`);

      zOriginX.set(`${zPoint.x}px`);
      zOriginY.set(`${zPoint.y}px`);
    });
  });

  const enable = () => setOrbitControllerProps({ enabled: true });
  const disable = () => setOrbitControllerProps({ enabled: false });

  const scale = useRef({
    x: size[0],
    z: size[1],
    runningX: 0,
    runningZ: 0,
  });

  return (
    <>
      <motion.circle
        ref={xScaleElRef}
        dragMomentum
        onPointerEnter={disable}
        onPointerLeave={enable}
        onPan={(_, info) => {
          const runningX = info.offset.x / 100;
          const startingScale = scale.current.x;
          scale.current.runningX = runningX;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(
            startingScale + runningX,
            1,
            scale.current.z
          );
        }}
        onPanEnd={() => {
          scale.current.x += scale.current.runningX;
          scale.current.runningX = 0;
        }}
        initial={{ opacity: 0, scale: 0 }}
        style={{
          originX: xOriginX,
          originY: xOriginY,
          cursor: "ew-resize",
        }}
        variants={{
          containerHover: {
            opacity: 1,
            scale: 1,
          },
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
          const startingScale = scale.current.z;
          scale.current.runningZ = scaleY;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(
            scale.current.x,
            1,
            startingScale + scaleY
          );
        }}
        onPanEnd={() => {
          scale.current.z += scale.current.runningZ;
          scale.current.runningZ = 0;
        }}
        initial={{ opacity: 0, scale: 0 }}
        style={{
          originX: zOriginX,
          originY: zOriginY,
          cursor: "ns-resize",
        }}
        variants={{
          containerHover: {
            opacity: 1,
            scale: 1,
          },
        }}
        r={5}
        fill="red"
      />
    </>
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

  const scale = useRef({
    x: 1,
    z: 1,
    runningX: 0,
    runningZ: 0,
  });

  return (
    <>
      <polyline points={points} ref={polylineRef} fill="none" stroke="black" />
      <motion.circle
        ref={xScaleElRef}
        dragMomentum
        onPointerEnter={disable}
        onPointerLeave={enable}
        onPan={(_, info) => {
          const runningX = info.offset.x / 100;
          const startingScale = scale.current.x;
          scale.current.runningX = runningX;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(
            startingScale + runningX,
            1,
            scale.current.z
          );
        }}
        onPanEnd={() => {
          scale.current.x += scale.current.runningX;
          scale.current.runningX = 0;
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
          const startingScale = scale.current.z;
          scale.current.runningZ = scaleY;
          const mesh = cuboid.mesh.current;
          mesh.geometry = new THREE.BoxGeometry(
            scale.current.x,
            1,
            startingScale + scaleY
          );
        }}
        onPanEnd={() => {
          scale.current.z += scale.current.runningZ;
          scale.current.runningZ = 0;
        }}
        r={5}
        fill="red"
      />
    </>
  );
}

function CornerVerts({ corners }: { corners: Props["corners"] }) {
  const { cuboid } = useGeometry();
  const textRefs = useRef<SVGTextElement[]>([]);

  cuboid.vertices.on("change", updateCornerLabels);

  function getCorners(verts: Point[]) {
    const center = getCentroid(...verts);

    const orderMap = [0, 1, 4, 5, 2, 3, 6, 7];
    const cornerLabelsReordered = orderMap.map((i) =>
      corners?.[i] ? corners[i] : false
    );

    return Array.from({ length: 8 }, (_, i) => {
      const p = verts[i];
      const x = p.x + (p.x - center.x) * 0.12;
      const y = p.y + (p.y - center.y) * 0.12;

      const hasOwnLabel = typeof cornerLabelsReordered?.[i] === "string";
      const label = hasOwnLabel
        ? (cornerLabelsReordered?.[i] as string)
        : String.fromCharCode(65 + orderMap[i]);

      return {
        x,
        y,
        label,
      };
    }).filter((_, i) => cornerLabelsReordered?.[i] !== false);
  }

  function updateCornerLabels(verts: Point[]) {
    const corners = getCorners(verts);
    corners.forEach((corner, i) => {
      const text = textRefs.current[i];
      text.setAttribute("x", corner.x.toString());
      text.setAttribute("y", corner.y.toString());
    });
  }

  return getCorners(cuboid.vertices.get()).map(({ label, ...pos }, i) => (
    <text
      key={i}
      {...pos}
      dominantBaseline="middle"
      textAnchor="middle"
      ref={(el) => {
        textRefs.current[i] = el!;
      }}
      style={{
        fill: "#475569",
        fontSize: 10,
        stroke: "none",
        textTransform: "uppercase",
        fontWeight: 500,
        letterSpacing: -0.8,
      }}
      fontSize={10}
    >
      {/* {i} */}
      {label}
    </text>
  ));
}

function Faces() {
  const { cuboid, cameraRef } = useGeometry();
  const faceRefs = useRef<SVGPolygonElement[]>([]);

  cuboid.vertices.on("change", updateFaces);

  function calculateFaces(verts: Point[]) {
    return Array.from({ length: 6 }, (_, i) => {
      const [p1, p2, p3, p4] = verts.slice(i * 4, i * 4 + 4);
      const points = [p1, p2, p4, p3].map((v) => `${v.x},${v.y}`).join(" ");

      const normal = new THREE.Vector3();
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const c = new THREE.Vector3();

      const geometry = cuboid.mesh.current.geometry as THREE.BufferGeometry;

      const index = i * 4;
      a.fromBufferAttribute(geometry.attributes.position, index);
      b.fromBufferAttribute(geometry.attributes.position, index + 1);
      c.fromBufferAttribute(geometry.attributes.position, index + 2);

      normal.crossVectors(b.sub(a), c.sub(a)).normalize();
      const cameraDirection = new THREE.Vector3();

      const camera = cameraRef.current;
      camera.getWorldDirection(cameraDirection);
      const dot = normal.dot(cameraDirection);
      const flipped = dot < 0;

      return {
        points,
        fill: flipped ? "rgba(148, 163, 184, 0.1)" : "rgba(0,0,0,0)",
        stroke: flipped ? "#94a3b839" : "#94a3b8",
      };
    });
  }

  function updateFaces(verts: Point[]) {
    const faces = calculateFaces(verts);
    faces.forEach((face, i) => {
      const ref = faceRefs.current[i];
      ref.setAttribute("points", face.points);
      ref.setAttribute("fill", face.fill);
      ref.setAttribute("stroke", face.stroke);
    });
  }

  return calculateFaces(cuboid.vertices.get()).map((face, i) => (
    <polygon
      key={i}
      ref={(el) => {
        faceRefs.current[i] = el!;
      }}
      strokeLinejoin="round"
      points={face.points}
      fill={face.fill}
      stroke={face.stroke}
    />
  ));
}

function createInitialScene(props: Props) {
  const camera = new THREE.OrthographicCamera(
    -192, // left
    192, // right
    128, // top
    -128, // bottom
    1,
    1000
  );

  const position = props.rotation || defaultRotation;
  camera.position.set(...(position as [number, number, number]));
  camera.lookAt(0, 0, 0);
  camera.updateWorldMatrix(true, true);

  camera.zoom = props.zoom ?? defaultZoom;
  camera.updateProjectionMatrix();

  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(props.size[0], 1, props.size[1]);
  const mesh = new THREE.Mesh(geometry);
  scene.add(mesh);

  return { mesh, camera };
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

    const x = vertex.x * 0.5 * size.width;
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

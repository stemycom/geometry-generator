"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Vector3, Color, type Mesh } from "three";
import { SVGRenderer } from "three-stdlib";

function Shape({
  onUpdate,
}: {
  onUpdate: (nr: { x: number; y: number }[]) => void;
}) {
  const ref = useRef<Mesh>(null);
  const [hovered, set] = useState(false);
  const customCircle = useRef<SVGCircleElement>(null);

  useFrame(({ camera, size, gl }) => {
    const mesh = ref.current!;
    if (!mesh) return;

    if (!customCircle.current) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("r", "10");
      circle.setAttribute("stroke", "red");
      circle.setAttribute("stroke-width", "3");
      circle.setAttribute("fill", "none");
      customCircle.current = circle;
      gl.domElement.appendChild(circle);
    }

    function updateCircle(x: number, y: number) {
      customCircle.current!.setAttribute("cx", x.toString());
      customCircle.current!.setAttribute("cy", y.toString());
    }
    //mesh.rotation.x += 0.01;
    //mesh.rotation.y += 0.01;

    const geometry = mesh.geometry;
    const positionAttr = geometry.attributes.position;
    const vertex = new Vector3();

    const { matrixWorld } = mesh;

    const vertPositions = [];
    for (let i = 0; i < positionAttr.count; i++) {
      // Get each vertex from the geometry
      vertex.fromBufferAttribute(positionAttr, i);

      // Apply the mesh's world matrix to the vertex to take into account its global position, rotation, and scale
      vertex.applyMatrix4(matrixWorld);

      // Now, project this world position to NDC
      vertex.project(camera);

      // Convert NDC to screen space
      const x = (vertex.x * 0.5 + 0.5) * size.width;
      const y = -(vertex.y * 0.5 - 0.5) * size.height;

      if (i === 2) {
        updateCircle(
          vertex.x * 0.5 * size.width,
          vertex.y * -0.5 * size.height
        );
      }

      // vertPositions.push({ x: +x.toPrecision(2), y: +y.toPrecision(2) });
      vertPositions.push({ x, y });
      // console.log(`Vertex ${i} screen position: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    onUpdate(vertPositions);
  }, 2);

  return (
    <mesh
      ref={ref}
      onPointerOver={() => set(true)}
      onPointerOut={() => set(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial opacity={0.1} />
    </mesh>
  );
}

export default function () {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const path = useMotionTemplate``;
  const path2 = useMotionTemplate``;

  const bottomPath = useMotionTemplate``;

  const vertMarkers = useMotionValue<Point[]>([]);

  return (
    <div>
      <div className="w-full aspect-square">
        <Canvas
          orthographic
          camera={{ position: [0, 0, 5], zoom: 20 }}
          gl={(canvas) => {
            const gl = new SVGRenderer();
            const parent = canvas.parentNode;
            parent.removeChild(canvas);
            parent.appendChild(gl.domElement);
            return gl;
          }}
        >
          <OrbitControls />
          <Shape
            onUpdate={(verts) => {
              vertMarkers.set(verts);

              const [v1, v2, v3, v4] = verts.slice(0, 4);
              path.set([v1, v2, v4, v3].map((v) => `${v.x},${v.y}`).join(" "));

              const [v5, v6, v7, v8] = verts.slice(4, 8);
              path2.set([v5, v6, v8, v7].map((v) => `${v.x},${v.y}`).join(" "));

              const avg1 = avgPoint(v1, v6);
              const avg2 = avgPoint(v5, v6);

              const curveRatio = 0.5522847498;
              const curve1 = avgPoint(avg1, v6, 1 - curveRatio);
              const curve2 = avgPoint(avg2, v6, curveRatio);

              const avg3 = avgPoint(v2, v5);
              const curve3 = avgPoint(avg3, v5, curveRatio);
              const curve4 = avgPoint(avg2, v5, curveRatio);

              const avg4 = avgPoint(v7, v2);

              bottomPath.set(
                `M ${avg1.x} ${avg1.y}
                C ${curve1.x} ${curve1.y} ${curve2.x} ${curve2.y} ${avg2.x} ${avg2.y}
                C ${curve4.x} ${curve4.y} ${curve3.x} ${curve3.y} ${avg3.x} ${avg3.y}
                L ${v2.x} ${v2.y} Z`
              );

              x.set(avg4.x);
              y.set(avg4.y);
            }}
          />
        </Canvas>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.circle
            cx={x}
            cy={y}
            r="10"
            stroke="red"
            strokeWidth="3"
            fill="none"
          />
          <motion.path
            d={bottomPath}
            stroke="red"
            strokeWidth={2}
            fill="none"
          />
          <motion.polygon
            points={path}
            stroke="black"
            strokeWidth="2"
            fill="none"
          />
          <motion.polygon
            points={path2}
            stroke="black"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
      <svg width="300" height="200">
        <ellipse
          cx={150}
          cy={50}
          rx={100}
          ry={50}
          stroke="black"
          strokeWidth="2"
          fill="none"
        />
        <ellipse
          cx={150}
          cy={150}
          rx={100}
          ry={50}
          stroke="black"
          strokeWidth="2"
          fill="none"
        />
        <line x1={50} y1={50} x2={50} y2={150} stroke="black" strokeWidth="2" />
        <line
          x1={250}
          y1={50}
          x2={250}
          y2={150}
          stroke="black"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function avgPoint(point1: Point, point2: Point, t = 0.5): Point {
  return {
    x: point1.x + t * (point2.x - point1.x),
    y: point1.y + t * (point2.y - point1.y),
  };
}

type Point = { x: number; y: number };

function averagePoints(point1: Point, point2: Point): Point {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
}

"use client";

import { createRoot } from "react-dom/client";
import React, { useRef, useState } from "react";
import { Canvas, Vector2, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SVGRenderer, SVGObject } from "three-stdlib";
import { type Mesh, Vector3, Box3, MeshToonMaterial } from "three";
import {
  motion,
  transform,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

function Shape({
  onUpdate,
}: {
  onUpdate: (nr: { x: number; y: number }[]) => void;
}) {
  const ref = useRef<Mesh>(null);

  const [hovered, set] = useState(false);
  useFrame(({ camera, size }) => {
    const mesh = ref.current!;
    if (!mesh) return;
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

      vertPositions.push({ x, y });
      // console.log(`Vertex ${i} screen position: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    onUpdate(vertPositions);
  });

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

  return (
    <div>
      <div className="w-96 h-96">
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1], zoom: 100 }}
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
              const [v1, v2, v3, v4] = verts.slice(0, 4);
              path.set([v1, v2, v4, v3].map((v) => `${v.x},${v.y}`).join(" "));

              const [v5, v6, v7, v8] = verts.slice(4, 8);
              path2.set([v5, v6, v8, v7].map((v) => `${v.x},${v.y}`).join(" "));

              const vert = verts[0];
              x.set(vert.x);
              y.set(vert.y);
            }}
          />
        </Canvas>
        <svg className="absolute inset-0 w-96 h-96 pointer-events-none">
          <motion.circle
            cx={x}
            cy={y}
            r="10"
            stroke="red"
            strokeWidth="3"
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

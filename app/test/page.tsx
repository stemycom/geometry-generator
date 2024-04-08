"use client";

import { createRoot } from "react-dom/client";
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SVGRenderer, SVGObject } from "three-stdlib";

function Shape(props) {
  const ref = useRef(null);
  const [hovered, set] = useState(false);
  useFrame(({ camera }, delta) => {
    //console.log(camera);
    ref.current!.rotation!.x += 0.01;
    ref.current!.rotation!.y += 0.01;
  });

  console.log(ref);
  return (
    <mesh
      ref={ref}
      onPointerOver={() => set(true)}
      onPointerOut={() => set(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={hovered ? "lightblue" : "hotpink"} />
    </mesh>
  );
}

export default function () {
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
          <Shape />
        </Canvas>
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

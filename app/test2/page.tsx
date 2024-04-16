"use client";

import * as THREE from "three";
import { Interactive } from "./interactive";
import { createRef, useEffect, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { set } from "date-fns";

const size = { width: 300, height: 200 };

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
camera.zoom = 200;
camera.position.set(1, 0.5, -0.5);
camera.lookAt(0, 0, 0);

const geometry = new THREE.BoxGeometry(1, 1, 1);

const cube = new THREE.Mesh(geometry);
cube.rotation.set(0.5, 0.5, 0.5);

scene.add(cube);

const vertPositions: Point[] = [];
updateVertPositions();
function updateVertPositions() {
  const positionAttr = cube.geometry.attributes.position;

  const vertex = new THREE.Vector3();

  vertPositions.length = 0;
  for (let i = 0; i < positionAttr.count; i++) {
    vertex.fromBufferAttribute(positionAttr, i);

    vertex.applyMatrix4(cube.matrixWorld);
    vertex.project(camera);

    const x = vertex.x * 0.5 * size.height;
    const y = -vertex.y * 0.5 * size.height;

    vertPositions.push({ x, y });
  }
}

function Cube({ update }: { update: number }) {
  const path = vertPositions.map(({ x, y }) => `${x},${y}`).join(" ");
  const length = 6;

  updateVertPositions();

  return (
    <g>
      <text x={0} y={0} fontSize={10} textAnchor="middle">
        {update}
      </text>
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
  const svgRef = createRef<SVGSVGElement>();
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;
    const controls = new OrbitControls(
      camera,
      svgRef.current as unknown as HTMLElement
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    controls.addEventListener("start", () => {});
    controls.addEventListener("change", () => {
      setUpdate((u) => u + 1);
    });
    controls.addEventListener("end", () => {
      animate();
    });

    function animate() {
      const shouldUpdate = controls.update();
      if (shouldUpdate) requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    // function rotate() {
    //   cube.rotation.x += 0.1;
    //   requestAnimationFrame(rotate);
    //   setUpdate((u) => u + 1);
    // }
    // rotate();
  }, []);

  return (
    <div className="grid">
      <svg
        ref={svgRef}
        className="w-full max-w-96 aspect-square bg-white [grid-area:1/1]"
        viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
      >
        <Cube update={update} />
      </svg>
      {/* <Interactive /> */}
      {/* <pre className="text-xs">{JSON.stringify(vertPositions, null, 2)}</pre> */}
      <pre className="text-xs">{JSON.stringify(cube.rotation, null, 2)}</pre>
    </div>
  );
}

type Point = {
  x: number;
  y: number;
};

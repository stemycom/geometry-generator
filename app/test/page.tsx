"use client";

import { OrbitControls } from "@react-three/drei";
import { Camera, Canvas, useFrame } from "@react-three/fiber";
import { SVGTextElementAttributes, useRef, useState } from "react";
import { Vector3, type Mesh } from "three";
import { SVGRenderer } from "three-stdlib";

function Shape() {
  const ref = useRef<Mesh>(null);
  const [hovered, set] = useState(false);

  const verts = useRef<SVGTextElement[]>(null!);
  function setupVerts(root: SVGSVGElement, length: number) {
    const els = Array.from({ length }, () => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
      el.setAttribute("font-size", "20");
      el.setAttribute("fill", "red");
      root.appendChild(el);
      return el;
    });
    verts.current = els;
  }
  function updateVerts(points: Point[]) {
    points.forEach(({ x, y }, i) => {
      const el = verts.current[i];
      el.setAttribute("x", x.toString());
      el.setAttribute("y", y.toString());
      el.textContent = i.toString();
      // el.textContent = String.fromCharCode(65 + i);
    });
  }

  const wireframe = useRef<SVGPolygonElement>(null!);
  function setupWireframe(root: SVGSVGElement) {
    const el = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    el.setAttribute("stroke", "black");
    el.setAttribute("stroke-width", "2");
    el.setAttribute("fill", "none");
    wireframe.current = el;
    root.appendChild(el);
  }
  function updateWireframe(points: Point[]) {
    wireframe.current!.setAttribute(
      "points",
      points.map((v) => `${v.x},${v.y}`).join(" ")
    );
  }

  const customFace = useRef<SVGPolygonElement>(null!);
  function setupFace(root: SVGSVGElement) {
    const el = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    el.setAttribute("stroke", "rgba(0,0,255,0.5)");
    el.setAttribute("fill", "rgba(0,0,255,0.1)");
    el.setAttribute("stroke-width", "2");
    customFace.current = el;
    root.appendChild(el);
  }
  function updateFace(points: Point[], camera: Camera, mesh: Mesh) {
    const [p1, p2, p3, p4] = points;
    customFace.current!.setAttribute(
      "points",
      [p1, p2, p4, p3].map((v) => `${v.x},${v.y}`).join(" ")
    );
    //update look based on backface visibility
    const normal = new Vector3();
    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    a.fromBufferAttribute(mesh.geometry.attributes.position, 0);
    b.fromBufferAttribute(mesh.geometry.attributes.position, 1);
    c.fromBufferAttribute(mesh.geometry.attributes.position, 2);
    normal.crossVectors(b.sub(a), c.sub(a)).normalize();
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    const dot = normal.dot(cameraDirection);
    const flipped = dot < 0;
    if (flipped) {
      customFace.current!.setAttribute("stroke-dasharray", "8,8");
      customFace.current!.setAttribute("stroke", "rgba(0,0,0,0.25)");
      customFace.current!.setAttribute("fill", "rgba(148,163,184,0.1)");
    } else {
      customFace.current!.setAttribute("stroke-dasharray", "0");
      customFace.current!.setAttribute("stroke", "black");
      customFace.current!.setAttribute("fill", "rgba(0,0,0,0)");
    }
  }

  const customCircle = useRef<SVGCircleElement>(null!);
  function setupCircle(root: SVGSVGElement) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("r", "10");
    circle.setAttribute("stroke", "red");
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("fill", "none");
    customCircle.current = circle;
    root.appendChild(circle);
  }
  function updateCircle(x: number, y: number) {
    customCircle.current!.setAttribute("cx", x.toString());
    customCircle.current!.setAttribute("cy", y.toString());
  }

  useFrame(({ camera, size, gl }) => {
    const mesh = ref.current!;
    if (!mesh) return;

    if (!customCircle.current)
      setupCircle(gl.domElement as unknown as SVGSVGElement);
    if (!customFace.current)
      setupFace(gl.domElement as unknown as SVGSVGElement);
    if (!wireframe.current)
      setupWireframe(gl.domElement as unknown as SVGSVGElement);

    const geometry = mesh.geometry;
    const positionAttr = geometry.attributes.position;
    const vertex = new Vector3();

    if (!verts.current)
      setupVerts(gl.domElement as unknown as SVGSVGElement, 8);

    const { matrixWorld } = mesh;

    const vertPositions = [];
    for (let i = 0; i < positionAttr.count; i++) {
      // Get each vertex from the geometry
      vertex.fromBufferAttribute(positionAttr, i);

      // Apply the mesh's world matrix to the vertex to take into account its global position, rotation, and scale
      vertex.applyMatrix4(matrixWorld);

      // Now, project this world position to NDC
      vertex.project(camera);

      const x = vertex.x * 0.5 * size.width;
      const y = -vertex.y * 0.5 * size.height;

      if (i === 2) {
        updateCircle(x, y);
      }

      // vertPositions.push({ x: +x.toPrecision(2), y: +y.toPrecision(2) });
      vertPositions.push({ x, y });
      // console.log(`Vertex ${i} screen position: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
    updateVerts([...vertPositions].slice(0, 8));
    updateFace(vertPositions, camera, mesh);
    // updateWireframe(vertPositions);
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
  return (
    <div className="w-full max-w-96 aspect-square bg-white">
      <Canvas
        orthographic
        camera={{ position: [1, 1, 1.5], zoom: 200 }}
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
  );
}

type Point = { x: number; y: number };

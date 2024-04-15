"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, DragControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

export function Interactive() {
  const dragRef = useRef(null);
  const [matrix, setMatrix] = useState(new THREE.Matrix4());

  return (
    <Canvas
      className="w-full max-w-96 aspect-square bg-white"
      orthographic
      camera={{ position: [-1, 1, 1.5], zoom: 100 }}
    >
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight
        position={[-10, -10, -10]}
        decay={0}
        intensity={Math.PI * 2}
      />
      <Box position={[0, 0, 0]} />

      <DragControls
        matrix={matrix}
        autoTransform={false}
        onDrag={(localMatrix) => {
          if (dragRef.current === null) return;
          //lock in the x and y axis
          localMatrix.compose(
            new THREE.Vector3(0, 0, localMatrix.elements[12]),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          );
          matrix.copy(localMatrix);
          setMatrix(matrix);
        }}
      >
        <mesh
          ref={dragRef}
          position={[
            matrix.elements[12],
            matrix.elements[13],
            matrix.elements[14],
          ]}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </DragControls>
      {/* <OrbitControls /> */}
    </Canvas>
  );
}

function Box(props) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef();
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  //   useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <>
      <mesh
        {...props}
        ref={meshRef}
        scale={active ? 1.5 : 1}
        //   onClick={(event) => setActive(!active)}
        //   onPointerOver={(event) => setHover(true)}
        //   onPointerOut={(event) => setHover(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
      </mesh>
    </>
  );
}

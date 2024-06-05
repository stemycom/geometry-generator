"use client";

import { cuboidDrawPrompt } from "@/app/ai-function-prompts";
import { Cuboid } from "@/components/cuboid";
import { useControls, Leva, folder, button, monitor } from "leva";
import { z } from "zod";

type Diagonals = z.infer<(typeof cuboidDrawPrompt)["parameters"]>["diagonals"];

export default function Test2() {
  const { body, front, base, depth, width, height } = useControls({
    sides: folder(
      {
        width: { value: "", optional: true },
        depth: { value: "", optional: true },
        height: { value: "", optional: true },
      },
      { collapsed: true }
    ),
    corners: folder(
      {
        //all 8 corners
        topLeft: { value: "", optional: true },
        topRight: { value: "", optional: true },
        bottomLeft: { value: "", optional: true },
        bottomRight: { value: "", optional: true },
        //top and bottom
        top: { value: "", optional: true },
        bottom: { value: "", optional: true },
        //left and right
        left: { value: "", optional: true },
        right: { value: "", optional: true },
      },
      { collapsed: true }
    ),
    diagonals: folder(
      {
        body: false,
        front: false,
        base: false,
      },
      { collapsed: true }
    ),
  });

  const diagonals: Diagonals = [];
  if (body) diagonals.push("body");
  if (front) diagonals.push("front");
  if (base) diagonals.push("base");

  function getSideValue(side: string | undefined): boolean | string {
    if (side === "") return true;
    if (side !== undefined) return side;
    return false;
  }

  return (
    <>
      <Cuboid
        size={[2, 1]}
        sides={[getSideValue(width), getSideValue(depth), getSideValue(height)]}
        diagonals={diagonals}
      />
      <pre>{JSON.stringify(diagonals, null, 2)}</pre>
      <Leva flat hideCopyButton titleBar={false} />
    </>
  );
}

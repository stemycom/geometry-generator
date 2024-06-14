"use client";

import { Cuboid } from "@/components/cuboid";
import { GeometryEditor } from "@/components/geometry/geometry-editor";
import { Polygon } from "@/components/polygon";
import { useState } from "react";
import { cuboidDrawPrompt, polygonDrawPrompt } from "../ai-function-prompts";
import { z } from "zod";

const exampleText =
  "I can help explain or visualize concepts related to geometry, including rounded shapes, but I can't directly modify the appearance of 3D models or their rendering styles to make edges appear rounded. However, if you're looking for a conceptual understanding or a mathematical description of a rounded cuboid.";

type CuboidProps = z.infer<(typeof cuboidDrawPrompt)["parameters"]>;
type PolygonProps = z.infer<(typeof polygonDrawPrompt)["parameters"]>;

export default function Test2() {
  const [cuboidProps, setCuboidProps] = useState<CuboidProps>({
    size: [2, 1],
  });
  const [polygonProps, setPolygonProps] = useState<PolygonProps>({
    points: "50,150 250,150 200,50 100,50",
  });

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2 my-16">
      <GeometryEditor
        type="polygon"
        params={polygonProps}
        onParamsChange={setPolygonProps}
      >
        <Polygon
          {...polygonProps}
          onPointsChage={(points) =>
            setPolygonProps((prev) => ({ ...prev, points }))
          }
        />
      </GeometryEditor>

      <GeometryEditor
        text={exampleText}
        type="cuboid"
        params={cuboidProps}
        onParamsChange={setCuboidProps}
      >
        <Cuboid
          {...cuboidProps}
          onSizeChange={(size) => setCuboidProps((prev) => ({ ...prev, size }))}
        />
      </GeometryEditor>
    </div>
  );
}

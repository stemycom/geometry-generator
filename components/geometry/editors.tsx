"use client";

import { Cuboid, CuboidProps } from "@/components/cuboid";
import { GeometryEditor } from "@/components/geometry/geometry-editor";
import { useState } from "react";
import { Polygon, PolygonProps } from "../polygon";

export function CuboidEditor(props: CuboidProps) {
  const [cuboidProps, setCuboidProps] = useState<CuboidProps>(props);

  return (
    <GeometryEditor
      type="cuboid"
      params={cuboidProps}
      onParamsChange={setCuboidProps}
    >
      <Cuboid
        {...cuboidProps}
        onSizeChange={(size) => setCuboidProps((prev) => ({ ...prev, size }))}
      />
    </GeometryEditor>
  );
}

export function PolygonEditor(props: PolygonProps) {
  const [polygonProps, setPolygonProps] = useState<PolygonProps>(props);

  return (
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
  );
}

"use client";

import { cuboidDrawPrompt } from "@/app/ai-function-prompts";
import { Cuboid, formatSideLabel } from "@/components/cuboid";
import {
  Polygon,
  PolygonProps,
  calculateAngleLabels,
  calculateSideLabels,
} from "@/components/polygon";
import { z } from "zod";

const exampleText =
  "I can help explain or visualize concepts related to geometry, including rounded shapes, but I can't directly modify the appearance of 3D models or their rendering styles to make edges appear rounded. However, if you're looking for a conceptual understanding or a mathematical description of a rounded cuboid.";

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

interface GeometryEditorBaseProps {
  text?: string;
  children: React.ReactNode;
}
type GeometryEditorProps = GeometryEditorBaseProps &
  (
    | {
        type: "cuboid";
        params: CuboidProps;
        onParamsChange: (props: CuboidProps) => void;
      }
    | {
        type: "polygon";
        params: PolygonProps;
        onParamsChange: (props: PolygonProps) => void;
      }
  );

function GeometryEditor({
  type,
  params,
  onParamsChange,
  text,
  children,
}: GeometryEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { flashLayer, fireAnimation } = useFlashOverlayAnimation();

  function getPropsInputs() {
    switch (type) {
      case "cuboid":
        return <PropsEditor props={params} onChange={onParamsChange} />;
      case "polygon":
        return (
          <>
            <SideEditor
              title="angles"
              count={countSides(params.points)}
              values={params.angles}
              placeHolders={calculateAngleLabels(params.points)}
              labels={({ i }) => `angle ${i + 1}`}
              onChange={(angles) => onParamsChange({ ...params, angles })}
            />
            {/* <SideEditor
              title="corners"
              count={countSides(params.points)}
              values={params.sides}
              placeHolders={calculateSideLabels(params.points)}
              onChange={(sides) => onParamsChange({ ...params, sides })}
            /> */}
            <SideEditor
              title="sides"
              count={countSides(params.points)}
              values={params.sides}
              labels={({ i }) => `side ${i + 1}`}
              placeHolders={calculateSideLabels(params.points)}
              onChange={(sides) => onParamsChange({ ...params, sides })}
            />
          </>
        );
    }
  }

  return (
    <div className="w-full bg-card-backdrop p-1 rounded-3xl">
      {text && <p className="text-stone-700 p-4">{text}</p>}
      <div
        className="relative bg-white flex justify-center items-center rounded-[1.25rem] overflow-hidden"
        ref={ref}
      >
        {children}
        <div
          className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none"
          ref={flashLayer}
        />
      </div>
      <div className="flex gap-[4px] justify-center items-center pl-4 pt-2 pr-2 pb-2">
        <h2 className="text-stone-700 mr-2 capitalize">{type}:</h2>
        {getPropsInputs()}
        <DownloadButton scope={ref.current!} onClick={() => fireAnimation()} />
      </div>
    </div>
  );
}

function countSides(path: string) {
  const sides = path.split(" ").filter((s) => s.length > 0);
  return sides.length;
}

function useFlashOverlayAnimation() {
  const [scope, animate] = useAnimate();
  async function fireAnimation() {
    await animate(
      scope.current,
      {
        backdropFilter: "blur(10px) contrast(2)",
        backgroundColor: "#bdbdbd",
      },
      {
        duration: 0.001,
      }
    );
    await animate(
      scope.current,
      {
        backdropFilter: "blur(0px) contrast(1)",
        backgroundColor: "#ffffff0",
      },
      {
        duration: 1,
        ease: cubicBezier(0, 0.75, 0.25, 1),
      }
    );
  }
  return { flashLayer: scope, fireAnimation };
}

type CuboidProps = z.infer<(typeof cuboidDrawPrompt)["parameters"]>;

function SideEditor({
  count,
  values,
  title,
  onChange,
  placeHolders,
  labels,
}: {
  count: number;
  values: CuboidProps["sides"];
  title: string;
  onChange: (values: CuboidProps["sides"]) => void;
  placeHolders: string[];
  labels: ({ i }: { i: number }) => string;
}) {
  const cornersEnabled = Array.isArray(values);
  const inputCount = Math.max(count, values?.length ?? 0);
  const [sideValues, setSideValues] = useState<
    { enabled: boolean; value: boolean | string }[]
  >(
    Array.from({ length: inputCount }, () => ({
      enabled: true,
      value: true,
    }))
  );

  function getValues(newState?: typeof sideValues): CuboidProps["sides"] {
    const _values = newState ?? sideValues;
    return _values.flatMap(({ enabled, value }) => {
      if (!enabled) return false;
      return typeof value === "string" ? value : true;
    });
  }

  return (
    <PopoverEditor
      title={title}
      enabled={cornersEnabled}
      className="gap-0 w-60"
      onClick={() =>
        !cornersEnabled &&
        onChange(
          sideValues.filter(({ enabled }) => enabled).map(({ value }) => value)
        )
      }
      onDisable={() => onChange(undefined)}
    >
      {sideValues.map(({ enabled, value }, i) => {
        const id = `side-${i}`;
        return (
          <fieldset
            className="flex items-center gap-3 py-1 hover:bg-gray-100 pr-4"
            key={i}
          >
            <Label className="flex-[0.7] pr-0" htmlFor={id}>
              {labels({ i })}
            </Label>
            <Checkbox
              id={id}
              checked={enabled}
              onClick={() => {
                setSideValues((values) => {
                  const newState = values.map((prev, _i) => {
                    if (_i === i) {
                      return {
                        ...prev,
                        enabled: !enabled,
                      };
                    }
                    return prev;
                  });
                  onChange(getValues(newState));
                  return newState;
                });
              }}
            />
            <Input
              id={id}
              disabled={!enabled}
              className="flex-1"
              value={typeof value === "string" ? value : undefined}
              placeholder={placeHolders?.[i]}
              onChange={(e) => {
                setSideValues((values) => {
                  const newState = values.map((prev, _i) => {
                    if (_i === i) {
                      return {
                        ...prev,
                        value: e.target.value,
                      };
                    }
                    return prev;
                  });
                  onChange(getValues(newState));
                  return newState;
                });
              }}
            />
          </fieldset>
        );
      })}
    </PopoverEditor>
  );
}

function PropsEditor({
  props,
  onChange,
}: {
  props: CuboidProps;
  onChange: (props: CuboidProps) => void;
}) {
  const sidesEnabled = Array.isArray(props.sides);
  const [sideValues, setSideValues] = useState<{
    [key: string]: { enabled: boolean; value?: string };
  }>({
    width: { enabled: true },
    depth: { enabled: true },
    height: { enabled: true },
  });

  const cornersEnabled = Array.isArray(props.corners);
  const [cornerValues, setCornerValues] = useState([
    {
      label: "top",
      inputs: [
        { label: "TL", value: "A" },
        { label: "TR", value: "B" },
        { label: "BL", value: "C" },
        { label: "BR", value: "D" },
      ],
    },
    {
      label: "bottom",
      inputs: [
        { label: "TL", value: "E" },
        { label: "TR", value: "F" },
        { label: "BL", value: "G" },
        { label: "BR", value: "H" },
      ],
    },
  ]);

  const diagonalsEnabled = Array.isArray(props.diagonals);
  const [diagonalValues, setDiagonalValues] = useState<
    CuboidProps["diagonals"]
  >(["base", "body", "front"]);

  function getSideValues(newState?: typeof sideValues): CuboidProps["sides"] {
    const _values = newState ?? sideValues;
    return Object.values(_values).map(({ enabled, value }) => {
      if (!enabled) return false;
      return typeof value === "string" ? value : true;
    });
  }

  function getCornerValues(
    newState?: typeof cornerValues
  ): CuboidProps["corners"] {
    const _values = newState ?? cornerValues;
    return _values.flatMap(({ inputs }) => {
      return Object.values(inputs).map(({ value }) => {
        if (value === "") return false;
        return value;
      });
    });
  }

  return (
    <>
      <PopoverEditor
        title="Sides"
        enabled={sidesEnabled}
        className="gap-1 w-56"
        onClick={() =>
          !sidesEnabled && onChange({ ...props, sides: getSideValues() })
        }
        onDisable={() => onChange({ ...props, sides: undefined })}
      >
        {Object.entries(sideValues).map(([side, { enabled, value }], index) => (
          <fieldset
            className="flex items-center gap-3 py-1 hover:bg-gray-100 pr-4"
            key={side}
          >
            <Label htmlFor={side} className="pr-0">
              {side}
            </Label>
            <Checkbox
              id={side}
              checked={enabled}
              onClick={() => {
                setSideValues((values) => {
                  const newState = {
                    ...values,
                    [side]: { enabled: !enabled, value },
                  };
                  onChange({ ...props, sides: getSideValues(newState) });
                  return newState;
                });
              }}
            />
            <Input
              id={side}
              disabled={!enabled}
              className="flex-1"
              value={value}
              onChange={(e) => {
                setSideValues((values) => {
                  const newState = {
                    ...values,
                    [side]: { enabled: true, value: e.target.value },
                  };
                  onChange({ ...props, sides: getSideValues(newState) });
                  return newState;
                });
              }}
              placeholder={formatSideLabel(index === 2 ? 1 : props.size[index])}
            />
          </fieldset>
        ))}
      </PopoverEditor>
      <PopoverEditor
        title="Corners"
        enabled={cornersEnabled}
        className="pt-2"
        onClick={() =>
          !cornersEnabled && onChange({ ...props, corners: getCornerValues() })
        }
        onDisable={() => onChange({ ...props, corners: undefined })}
      >
        {cornerValues.map((section) => (
          <div
            className="grid items-baseline grid-cols-6 gap-1 px-4"
            key={section.label}
          >
            <p className="col-span-2 text-xs uppercase tracking-wider">
              {section.label}
            </p>
            {section.inputs.map((input) => (
              <fieldset key={input.label}>
                <Input
                  className="text-center"
                  id={input.label}
                  value={input.value}
                  onChange={(e) => {
                    setCornerValues((values) => {
                      const newState = values.map((prev) => {
                        if (section.label === prev.label) {
                          return {
                            label: prev.label,
                            inputs: prev.inputs.map((oldInput) => {
                              if (oldInput.label === input.label) {
                                return {
                                  ...oldInput,
                                  value: e.target.value,
                                };
                              }
                              return oldInput;
                            }),
                          };
                        }
                        return prev;
                      });
                      onChange({
                        ...props,
                        corners: getCornerValues(newState),
                      });
                      return newState;
                    });
                  }}
                />
                <label
                  className="text-[10px] text-zinc-400 text-center w-full inline-block"
                  htmlFor={input.label}
                >
                  {input.label}
                </label>
              </fieldset>
            ))}
          </div>
        ))}
      </PopoverEditor>
      <PopoverEditor
        title="Diagonals"
        enabled={diagonalsEnabled}
        onClick={() =>
          !diagonalsEnabled && onChange({ ...props, diagonals: diagonalValues })
        }
        onDisable={() => onChange({ ...props, diagonals: undefined })}
      >
        <div>
          {(["base", "body", "front"] as const).map((diagonal) => (
            <fieldset
              className="flex items-center hover:bg-gray-100 pl-4"
              key={diagonal}
            >
              <Checkbox
                checked={
                  diagonalsEnabled ? diagonalValues?.includes(diagonal) : false
                }
                id={diagonal}
                onCheckedChange={(checked) => {
                  setDiagonalValues((values) => {
                    const arr = values ? values : [];
                    const newState = checked
                      ? [...arr, diagonal]
                      : arr.filter((value) => value !== diagonal);
                    onChange({ ...props, diagonals: newState });
                    return newState;
                  });
                }}
              />
              <Label htmlFor={diagonal}>{diagonal}</Label>
            </fieldset>
          ))}
        </div>
      </PopoverEditor>
    </>
  );
}

import { useRef, useState } from "react";
import { cn, spring } from "@/lib/utils";
import { cubicBezier, motion, useAnimate } from "framer-motion";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DownloadButton } from "./download-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const PopoverEditor = ({
  title,
  children,
  onClick,
  enabled,
  onDisable,
  className,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  enabled?: boolean;
  onDisable?: () => void;
  className?: string;
}) => (
  <Popover>
    <motion.div
      layout
      style={{
        borderRadius: 99,
      }}
      transition={spring.smooth}
      className={cn(
        "flex items-center bg-stone-600/5 outline outline-[0.5px] outline-transparent text-zinc-500 tracking-wider text-xs h-6 font-medium p-[2px]",
        "hover:outline-stone-200 transition-colors duration-200 hover:transition-none",
        !enabled &&
          "hover:bg-black/10 hover:text-zinc-500 hover:active:bg-white active:transition-none",
        enabled && "bg-white outline-zinc-300"
      )}
    >
      <PopoverTrigger
        className={cn("uppercase px-2 py-1 z-10", enabled && "pr-0 -mr-[1px]")}
        onClick={onClick}
        asChild
      >
        <motion.button layout transition={{ duration: 0 }}>
          {title}
        </motion.button>
      </PopoverTrigger>
      {enabled && (
        <motion.button
          initial={{ opacity: 0, scale: 0, x: 4 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={spring.smooth}
          className="flex items-center justify-center h-full aspect-square hover:bg-zinc-100 rounded-full active:bg-zinc-200"
          onClick={onDisable}
        >
          <Cross2Icon className="w-3" />
        </motion.button>
      )}
    </motion.div>

    <PopoverContent className="px-0">
      <div className={cn("flex flex-col gap-2.5", className)}>{children}</div>
    </PopoverContent>
  </Popover>
);

function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        "text-xs uppercase tracking-wider peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 px-4 py-2",
        className
      )}
    >
      {children}
    </label>
  );
}

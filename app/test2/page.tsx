"use client";

import { cuboidDrawPrompt } from "@/app/ai-function-prompts";
import { Cuboid } from "@/components/cuboid";
import { z } from "zod";

export default function Test2() {
  const [props, setProps] = useState<CuboidProps>({
    size: [2, 1],
  });

  return (
    <div className="mx-auto w-full max-w-lg my-16 bg-[#F3F2F0] p-2 rounded-3xl">
      <div className="bg-white flex justify-center items-center p-2 rounded-2xl">
        <Cuboid {...props} />
      </div>
      <div className="flex gap-1 p-2">
        <h2>Risttahukas</h2>
        <PropsEditor props={props} onChange={setProps} />
      </div>
      <pre className="text-xs">{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

type CuboidProps = z.infer<(typeof cuboidDrawPrompt)["parameters"]>;

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
        onClick={() =>
          !sidesEnabled && onChange({ ...props, sides: getSideValues() })
        }
        onDisable={() => onChange({ ...props, sides: undefined })}
      >
        {Object.entries(sideValues).map(([side, { enabled, value }]) => (
          <fieldset className="flex gap-5 items-center">
            <label
              className="text-[13px] text-violet11 w-[75px]"
              htmlFor={side}
            >
              {side}
            </label>
            <input
              type="checkbox"
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
            <input
              className="w-full inline-flex items-center justify-center flex-1 rounded px-2.5 text-[13px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-violet8 outline-none"
              id={side}
              disabled={!enabled}
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
              placeholder="10 cm"
            />
          </fieldset>
        ))}
      </PopoverEditor>
      <PopoverEditor
        title="Corners"
        enabled={cornersEnabled}
        onClick={() =>
          !cornersEnabled && onChange({ ...props, corners: getCornerValues() })
        }
        onDisable={() => onChange({ ...props, corners: undefined })}
      >
        {cornerValues.map((section) => (
          <div className="grid grid-cols-6 gap-1">
            <p className="col-span-2">{section.label}</p>
            {section.inputs.map((input) => (
              <fieldset>
                <input
                  className="w-full inline-flex items-center justify-center flex-1 rounded px-2.5 text-[13px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-violet8 outline-none text-center"
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
                  className="text-[12px] text-slate-400 text-center w-full inline-block"
                  htmlFor={input.label}
                >
                  {input.label}
                </label>
              </fieldset>
            ))}
          </div>
        ))}
      </PopoverEditor>
      <PopoverEditor title="Diagonals">
        {[{ label: "top" }, { label: "bottom" }].map((corner) => (
          <fieldset className="flex gap-5 items-center">
            <label
              className="text-[13px] text-violet11 w-[75px]"
              htmlFor={corner.label}
            >
              {corner.label}
            </label>
            <input type="checkbox" checked id={corner.label} />
            <input
              className="w-full inline-flex items-center justify-center flex-1 rounded px-2.5 text-[13px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-violet8 outline-none"
              id={corner.label}
              placeholder="10 cm"
            />
          </fieldset>
        ))}
      </PopoverEditor>
    </>
  );
}

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const PopoverEditor = ({
  title,
  children,
  onClick,
  enabled,
  onDisable,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  enabled?: boolean;
  onDisable?: () => void;
}) => (
  <Popover.Root>
    <motion.div
      layout
      style={{
        borderRadius: 99,
      }}
      className={cn(
        "flex bg-black/5 text-slate-600 tracking-wider text-xs h-6 font-medium",
        enabled && "bg-white"
      )}
    >
      <Popover.Trigger
        className={cn("uppercase px-3 py-1", enabled && "pr-0")}
        onClick={onClick}
        asChild
      >
        <motion.button layout transition={{ duration: 0 }}>
          {title}
        </motion.button>
      </Popover.Trigger>
      {enabled && (
        <button
          className="inline-block w-6 h-6 rounded-e-full hover:bg-slate-100"
          onClick={onDisable}
        >
          x
        </button>
      )}
    </motion.div>

    <Popover.Portal>
      <Popover.Content
        className="rounded p-5 w-[260px] bg-white  will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
        sideOffset={5}
      >
        <div className="flex flex-col gap-2.5">
          <p className="text-mauve12 text-[15px] leading-[19px] font-medium mb-2.5">
            {title}
          </p>
          {children}
        </div>
        <Popover.Close
          className="rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 absolute top-[5px] right-[5px] hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 outline-none cursor-default"
          aria-label="Close"
        >
          x
        </Popover.Close>
        <Popover.Arrow className="fill-white" />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

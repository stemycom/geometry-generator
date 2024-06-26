"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  CaretDownIcon,
  SizeIcon,
  CopyIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

initWasm("./resvg.wasm");

const exportOptions = [
  "download-png",
  "download-svg",
  "copy-svg",
  "copy-png",
] as const;

type ExportOption = (typeof exportOptions)[number];

async function downloadFont() {
  const font = await fetch("./Inter-Regular.woff2");
  if (!font.ok) return null;
  const fontData = await font.arrayBuffer();
  return new Uint8Array(fontData);
}

let font: Uint8Array | null = null;
let loadingFont = false;

export function DownloadButton({
  onClick,
  scope,
}: {
  onClick: () => void;
  scope: Element;
}) {
  const [exportOption, setExportOption] =
    useState<ExportOption>("download-png");
  const sizes = [
    { width: 800, label: "2x (800x600)" },
    { width: 1600, label: "4x (1600x1200)" },
    { width: 2400, label: "6x (2400x1800)" },
  ];
  const [size, setSize] = useState(sizes[1]);

  useEffect(() => {
    if (font) return;
    loadingFont = true;
    downloadFont().then((_font) => {
      font = _font;
    });
  }, []);

  function download() {
    const svg = scope.querySelector("svg") as SVGSVGElement;
    const svgString = svg.outerHTML;
    switch (exportOption) {
      case "download-png":
        downloadPNG(svgString);
        break;
      case "download-svg":
        downloadSVG(svgString);
        break;
      case "copy-svg":
        copySVG(svgString);
        break;
      case "copy-png":
        copyPNG(svgString);
        break;
    }
  }

  function copySVG(svgString: string) {
    navigator.clipboard.writeText(svgString);
  }

  function svgToPng(svgString: string) {
    const resvg = new Resvg(svgString, {
      fitTo: {
        mode: "width",
        value: size.width,
      },
      font: {
        fontBuffers: [font as Uint8Array], // New in 2.5.0, loading custom fonts
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    return new Blob([pngBuffer], { type: "image/png" });
  }

  function copyPNG(svgString: string) {
    const blob = svgToPng(svgString);
    navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
  }

  function downloadPNG(svgString: string) {
    const blob = svgToPng(svgString);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cuboid.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSVG(svgString: string) {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cuboid.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getIcon() {
    switch (exportOption) {
      case "download-png":
      case "download-svg":
        return <DownloadIcon />;
      case "copy-svg":
      case "copy-png":
        return <CopyIcon />;
    }
  }

  return (
    <div className="flex ml-auto items-center bg-foreground rounded-full pr-0.5 hover:bg-black">
      <Button
        className="rounded-full bg-transparent hover:bg-transparent pr-3"
        onClick={() => {
          onClick();
          download();
        }}
      >
        {getIcon()}
      </Button>
      <div className="w-[0.5px] h-4 bg-muted/30" />
      <DropdownMenu>
        <DropdownMenuTrigger className="p-[6px] rounded-full outline-none hover:bg-accent/20">
          <CaretDownIcon className="text-white" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={exportOption}
            onValueChange={(val) => setExportOption(val as ExportOption)}
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SizeIcon className="mr-3" />
                Size
              </DropdownMenuSubTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={size.label}
                    onValueChange={(val) =>
                      setSize(sizes.find((s) => s.label === val)!)
                    }
                  >
                    {sizes.map((size) => (
                      <DropdownMenuRadioItem
                        value={size.label}
                        key={size.label}
                      >
                        {size.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuRadioItem value="copy-svg">
              <CopyIcon className="mr-3" />
              Copy SVG
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="copy-png">
              <CopyIcon className="mr-3" />
              Copy PNG
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="download-svg">
              <DownloadIcon className="mr-3" />
              Download SVG
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="download-png">
              <DownloadIcon className="mr-3" />
              Download PNG
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

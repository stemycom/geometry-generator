import { triangleDrawPrompt } from "@/app/ai-function-prompts";
import { Triangle } from "@/components/triangle";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDOMServer from "react-dom/server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const object = {
    points: (req.query.points as string) || "20,150 250,150 275,50",
    corners: (req.query.corners as string | undefined)?.split(","),
    angles: (req.query.angles as string | undefined)
      ?.split(",")
      .map(safeParseJson),
    sides: (req.query.sides as string | undefined)
      ?.split(",")
      .map(safeParseJson),
  };

  const result = triangleDrawPrompt.parameters.safeParse(object);
  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const props = result.data;
  const markup = ReactDOMServer.renderToStaticMarkup(<Triangle {...props} />);

  res.setHeader("Content-Type", "image/svg+xml");
  return res.status(200).send(markup);
}

function safeParseJson(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

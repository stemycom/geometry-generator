import { Triangle } from "@/components/triangle";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDOMServer from "react-dom/server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const props = {
    points: (req.query.points as string) || "20,150 250,150 275,50",
    corners: (req.query.corners as string | undefined)?.split(","),
    angles: (req.query.angles as string | undefined)
      ?.split(",")
      .map(safeParseJson),
    sides: (req.query.sides as string | undefined)
      ?.split(",")
      .map(safeParseJson),
  };

  const markup = ReactDOMServer.renderToStaticMarkup(<Triangle {...props} />);

  res.setHeader("Content-Type", "image/svg+xml");
  return res.status(200).send(markup);
}

function safeParseJson(string: string) {
  try {
    return JSON.parse(string);
  } catch (e) {
    return string;
  }
}

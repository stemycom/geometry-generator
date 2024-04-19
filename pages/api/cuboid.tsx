import { Cuboid } from "@/app/test3/page";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDOMServer from "react-dom/server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const props = {
    size: (req.query.size as string) || "2,1",
    diagonals: (req.query.diagonals as string | undefined)
      ?.split(",")
      .map(safeParseJson),
    corners: (req.query.corners as string | undefined)
      ?.split(",")
      .map(safeParseJson),
    sides: (req.query.sides as string | undefined)
      ?.split(",")
      .map(safeParseJson),
  };

  //   return res.json(props);
  const markup = ReactDOMServer.renderToStaticMarkup(<Cuboid {...props} />);

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

///cuboid.svg?size=2%2C1&diagonals=body&corners=false%2CA%2Cfalse%2Cfalse%2Cfalse%2Cfalse%2Cfalse%2CB&sides=210cm%2C111cm%2C89cm

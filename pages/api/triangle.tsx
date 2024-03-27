import { Triangle } from "@/components/triangle";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDOMServer from "react-dom/server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const props = {
    points: (req.query.points as string) || "20,150 250,150 275,50",
    corners: (req.query.corners as string | undefined)?.split(","),
  };

  const markup = ReactDOMServer.renderToStaticMarkup(<Triangle {...props} />);

  res.setHeader("Content-Type", "image/svg+xml");
  return res.status(200).send(markup);
}

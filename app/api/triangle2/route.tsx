import { Triangle, TestSvg } from "@/components/triangle";
import ReactDOMServer from "react-dom/server.browser";
import { MotionConfig, motion } from "framer-motion";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  // const markup = ReactDOMServer.renderToStaticMarkup(
  //   <Triangle points="20,150 250,150 275,50" />
  // );
  const markup = ReactDOMServer.renderToStaticMarkup(<TestSvg />);
  return new Response(markup, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}

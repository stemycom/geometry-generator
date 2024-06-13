import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { Polygon } from "./polygon";
import { Cuboid } from "./cuboid";

const exampleMessages = [
  "Draw a cuboid with 2x1x1 dimensions.",
  "A cuboid with the diagonal A-B and all the side lengths.",
  "Draw a trapazoid.",
  "Draw a right angled triangle. And mark the 90degree angle.",
];

export function EmptyScreen({
  submitMessage,
}: {
  submitMessage: (message: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-3xl p-8 mb-4">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block">
          Math geometry generator
        </h1>
        <div className="grid">
          {/* <Cuboid size={[2, 1]} sides={[true, true, true]} />
          <Polygon
            points="50,150 250,50 250,150"
            angles={[false, false, true]}
            sides={["hüpotenuus", false, false]}
          /> */}
        </div>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto text-wrap text-left shadow-none bg-white"
              onClick={async () => {
                submitMessage(message);
              }}
            >
              {message}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

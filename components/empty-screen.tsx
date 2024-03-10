import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { Triangle } from "./triangle";

const exampleMessages = [
  "Draw a triangle.",
  "Draw a square.",
  "Draw a trapazoid.",
  "Draw a rectangle.",
  "Draw a right angled triangle.",
  "Draw a right angled triangle. And mark the 90degree angle.",
];

export function EmptyScreen({
  submitMessage,
}: {
  submitMessage: (message: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8 mb-4">
        <h1 className="mb-2 text-lg font-semibold">Geometry!</h1>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={async () => {
                submitMessage(message);
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message}
            </Button>
          ))}
        </div>
        <Triangle points="50,150 250,150 250,50" />
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </p>
    </div>
  );
}

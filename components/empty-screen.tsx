import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { Triangle } from "./triangle";

const exampleMessages = [
  {
    heading: "Draw me a right angled triangle.",
    message: "Draw me a right angled triangle.",
  },
  {
    heading: "Draw me a triangle with one side 5cm.",
    message: "Draw me a triangle with one side 5cm.",
  },
  {
    heading: "Draw me a triangle with angles 30, 60, 90 degrees.",
    message: "Draw me a triangle with angles 30, 60, 90 degrees.",
  },
  {
    heading: "Draw me an equilateral triangle.",
    message: "Draw me an equilateral triangle.",
  },
  {
    heading: "Draw me an isosceles triangle.",
    message: "Draw me an isosceles triangle.",
  },
  {
    heading: "Draw me a scalene triangle.",
    message: "Draw me a scalene triangle.",
  },
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
                submitMessage(message.message);
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
        <Triangle />
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </p>
    </div>
  );
}

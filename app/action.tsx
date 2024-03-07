import "server-only";

import { createAI, createStreamableUI, getMutableAIState } from "ai/rsc";
import OpenAI from "openai";

import { spinner, BotMessage, SystemMessage } from "@/components/llm-stocks";

import {
  runAsyncFnWithoutBlocking,
  sleep,
  formatNumber,
  runOpenAICompletion,
} from "@/lib/utils";
import { z } from "zod";
import { Triangle } from "@/components/triangle";
import { Shape } from "@/components/shape";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function confirmPurchase(symbol: string, price: number, amount: number) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  );

  const systemMessage = createStreamableUI(null);

  runAsyncFnWithoutBlocking(async () => {
    // You can update the UI at any point.
    await sleep(1000);

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    );

    await sleep(1000);

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{" "}
          {formatNumber(amount * price)}
        </p>
      </div>
    );

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={" "}
        {formatNumber(amount * price)}.
      </SystemMessage>
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "system",
        content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
          amount * price
        }]`,
      },
    ]);
  });

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: Date.now(),
      display: systemMessage.value,
    },
  };
}

async function submitUserMessage(content: string) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content,
    },
  ]);

  const reply = createStreamableUI(
    <BotMessage className="items-center">{spinner}</BotMessage>
  );

  const completion = runOpenAICompletion(openai, {
    model: "gpt-4-0125-preview",
    stream: true,
    messages: [
      {
        role: "system",
        content: `\
You are a math visualisation assistant specializing in geometric shapes.
You and the user can create math geometry for teaching.`,
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: [
      {
        name: "draw_geometry",
        description:
          "Get the current paramaters for drawing a basic 2D geometric shape. Use this to show the picture to the user. Keep in mind the bounds, so you dont draw outside width: 300 height:200",
        parameters: z.object({
          points: z
            .string()
            .describe(
              `The points to draw the shape. In SVG polygon path format e.g. "200,10 250,190 150,190"`
            ),
          marks: z
            .string()
            .describe(
              `A collection of marks to indicate point or points on the shape if asked. eg. Three marks: "200,10 250,190 150,190"`
            )
            .optional()
          // unknowns: z
          //   .object({
          //     key: z.string().describe("The key of the unknown angle."),
          //     index: z.number().describe("The index of the unknown angle."),
          //   })
          //   .describe(
          //     "The unknown angles to solve for. eg. { key: 'A', index: 1 }"
          //   ),
        }),
      },
    ],
    temperature: 0.1,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(<BotMessage>{content}</BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: "assistant", content }]);
    }
  });

  completion.onFunctionCall("draw_geometry", async ({ points, marks }) => {
    const markPositions = marks
      ?.split(" ")
      .map((point: string) => point.split(",").map(Number));

    console.log({ points, markPositions });

    reply.done(
      <svg viewBox="5 5 305 205" width="300" height="200">
        <polygon
          points={points}
          className="stroke stroke-2 stroke-slate-500 fill-none"
        />
        {markPositions?.map((point, index) => (
          <circle
            key={index}
            cx={point[0]}
            cy={point[1]}
            r={6}
            className="fill-none stroke-red-500 stroke-1"
          />
        ))}
      </svg>
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "draw_geometry",
        content: JSON.stringify({ points }),
      },
    ]);
  });

  return {
    id: Date.now(),
    display: reply.value,
  };
}

// Define necessary types and create the AI.

const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    confirmPurchase,
  },
  initialUIState,
  initialAIState,
});

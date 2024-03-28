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
    model: "gpt-4-turbo-preview",
    stream: true,
    messages: [
      {
        role: "system",
        content: `\
You are a math visualisation assistant specializing in geometric shapes.
You and the user can create math geometry for teaching math.`,
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: [
      {
        name: "draw_shape",
        description: `\
Get the current paramaters for drawing a 2D geometric shape.
Make sure the shape is always in correlation with the angles if it's provided. eg. 90° should always produce a right angle.
Keep in mind the bounds, so you dont draw outside width of 300 and height of 200. Try to use all of the space, but leave some padding.`,
        parameters: z.object({
          points: z
            .string()
            .describe(
              `The points to draw the shape. In SVG shape points format e.g. "200,10 250,190 150,190"`
            ),
          angles: z
            .array(z.union([z.string(), z.null()]))
            .describe(
              `\
A collection of marks to indicate an angle on the shape if asked. Use an array of strings: eg. ['a', 'b', 'c']
Use null to skip an index. eg. [null, 'X'] to mark the points or ['X', null, 'Z']`
            )
            .optional(),
          corners: z
            .array(z.union([z.string(), z.null()]))
            .describe(
              `
A collection of marks to indicate a vertecies on the shape if asked. Use an array of strings: eg. ['A', 'B', 'C']`
            )
            .optional(),
          sides: z
            .array(z.union([z.string(), z.null()]))
            .describe(
              `\
A collection of marks to indicate a sides on the shape if asked. Use an array of strings: eg. ['x', 'y', 'z']`
            )
            .optional(),
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

  completion.onFunctionCall("draw_shape", async (props) => {
    const { points, corners } = props;

    reply.done(
      <div className="flex">
        <Triangle points={points} corners={corners} />
        <pre className="text-sm">{JSON.stringify(props, null, 2)}</pre>
      </div>
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "draw_shape",
        content: JSON.stringify(props),
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

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
        name: "draw_triangle",
        description:
          "Get the current paramaters for drawing a triangle. Use this to show the picture to the user.",
        parameters: z.object({
          points: z
            .string()
            .describe(
              `The points to draw the rectangle. In SVG polygon path format e.g. "200,10 250,190 150,190"`
            ),
          unknowns: z
            .object({
              key: z.string().describe("The key of the unknown angle."),
              index: z.number().describe("The index of the unknown angle."),
            })
            .describe(
              "The unknown angles to solve for. eg. { key: 'A', index: 1 }"
            ),
        }),
      },
      // {
      //   name: "show_stock_purchase_ui",
      //   description:
      //     "Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.",
      //   parameters: z.object({
      //     symbol: z
      //       .string()
      //       .describe(
      //         "The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD."
      //       ),
      //     price: z.number().describe("The price of the stock."),
      //     numberOfShares: z
      //       .number()
      //       .describe(
      //         "The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it."
      //       ),
      //   }),
      // },
      // {
      //   name: "list_stocks",
      //   description: "List three imaginary stocks that are trending.",
      //   parameters: z.object({
      //     stocks: z.array(
      //       z.object({
      //         symbol: z.string().describe("The symbol of the stock"),
      //         price: z.number().describe("The price of the stock"),
      //         delta: z.number().describe("The change in price of the stock"),
      //       })
      //     ),
      //   }),
      // },
      // {
      //   name: "get_events",
      //   description:
      //     "List funny imaginary events between user highlighted dates that describe stock activity.",
      //   parameters: z.object({
      //     events: z.array(
      //       z.object({
      //         date: z
      //           .string()
      //           .describe("The date of the event, in ISO-8601 format"),
      //         headline: z.string().describe("The headline of the event"),
      //         description: z.string().describe("The description of the event"),
      //       })
      //     ),
      //   }),
      // },
    ],
    temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(<BotMessage>{content}</BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: "assistant", content }]);
    }
  });

  completion.onFunctionCall("draw_triangle", async ({ points, unknowns }) => {
    reply.done(<Triangle points={points} />);

    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "draw_triangle",
        content: JSON.stringify({ points }),
      },
    ]);
  });

  // completion.onFunctionCall("list_stocks", async ({ stocks }) => {
  //   console.log({ stocks });
  //   reply.update(
  //     <BotCard>
  //       <StocksSkeleton />
  //     </BotCard>
  //   );

  //   await sleep(1000);

  //   reply.done(
  //     <BotCard>
  //       <Stocks stocks={stocks} />
  //     </BotCard>
  //   );

  //   aiState.done([
  //     ...aiState.get(),
  //     {
  //       role: "function",
  //       name: "list_stocks",
  //       content: JSON.stringify(stocks),
  //     },
  //   ]);
  // });

  // completion.onFunctionCall("get_events", async ({ events }) => {
  //   reply.update(
  //     <BotCard>
  //       <EventsSkeleton />
  //     </BotCard>
  //   );

  //   await sleep(1000);

  //   reply.done(
  //     <BotCard>
  //       <Events events={events} />
  //     </BotCard>
  //   );

  //   aiState.done([
  //     ...aiState.get(),
  //     {
  //       role: "function",
  //       name: "list_stocks",
  //       content: JSON.stringify(events),
  //     },
  //   ]);
  // });

  // completion.onFunctionCall(
  //   "show_stock_price",
  //   async ({ symbol, price, delta }) => {
  //     reply.update(
  //       <BotCard>
  //         <StockSkeleton />
  //       </BotCard>
  //     );

  //     await sleep(1000);

  //     reply.done(
  //       <BotCard>
  //         <Stock name={symbol} price={price} delta={delta} />
  //       </BotCard>
  //     );

  //     aiState.done([
  //       ...aiState.get(),
  //       {
  //         role: "function",
  //         name: "show_stock_price",
  //         content: `[Price of ${symbol} = ${price}]`,
  //       },
  //     ]);
  //   }
  // );

  // completion.onFunctionCall(
  //   "show_stock_purchase_ui",
  //   ({ symbol, price, numberOfShares = 100 }) => {
  //     if (numberOfShares <= 0 || numberOfShares > 1000) {
  //       reply.done(<BotMessage>Invalid amount</BotMessage>);
  //       aiState.done([
  //         ...aiState.get(),
  //         {
  //           role: "function",
  //           name: "show_stock_purchase_ui",
  //           content: `[Invalid amount]`,
  //         },
  //       ]);
  //       return;
  //     }

  //     reply.done(
  //       <>
  //         <BotMessage>
  //           Sure!{" "}
  //           {typeof numberOfShares === "number"
  //             ? `Click the button below to purchase ${numberOfShares} shares of $${symbol}:`
  //             : `How many $${symbol} would you like to purchase?`}
  //         </BotMessage>
  //         <BotCard showAvatar={false}>
  //           <Purchase
  //             defaultAmount={numberOfShares}
  //             name={symbol}
  //             price={+price}
  //           />
  //         </BotCard>
  //       </>
  //     );
  //     aiState.done([
  //       ...aiState.get(),
  //       {
  //         role: "function",
  //         name: "show_stock_purchase_ui",
  //         content: `[UI for purchasing ${numberOfShares} shares of ${symbol}. Current price = ${price}, total cost = ${
  //           numberOfShares * price
  //         }]`,
  //       },
  //     ]);
  //   }
  // );

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

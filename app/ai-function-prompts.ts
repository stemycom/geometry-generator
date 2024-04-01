import { z } from "zod";

export const triangleDrawPrompt = {
  name: "draw_shape",
  description: `\
  Get the current paramaters for drawing a 2D geometric shape. The shape will be drawn on the screen.
  Keep in mind the bounds, so you dont draw outside width of 300 and height of 200. Try to use all of the space, but leave padding.`,
  parameters: z.object({
    points: z
      .string()
      .describe(
        `The points to draw the shape. In SVG shape points format e.g. "200,10 250,190 150,190"`
      ),
    angles: z
      .array(z.union([z.string(), z.boolean()]))
      .describe(
        `\
  For angle indicators. Use an array of strings: eg. ['a', 'b', 'c']. Keep the correlation of the points and angles.
  eg. If the points are "50,150 250,150 250,50" the 90 degree angle should be at the SECOND index. Since it corresponds to the second point "250,150".
  If you need to hide an angle, use false. eg. ['a', false, 'c']
  If you need to show an angle in degrees, use a boolean true value. The user will be shown calculated angle in degrees. eg. [true, true, true] (this will show all three angles in degrees)`
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
      .array(z.union([z.string(), z.boolean()]))
      .describe(
        `\
  A collection of marks to indicate a sides on the shape if asked. Use an array of strings: eg. ['x', 'y', 'z']
  If you need to show a side length, use a "true". The user will be shown calculated length. eg. [true, true, true] (this will show all three sides)`
      )
      .optional(),
  }),
};

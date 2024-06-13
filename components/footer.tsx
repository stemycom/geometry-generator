import React from "react";

import { cn } from "@/lib/utils";
import { ExternalLink } from "@/components/external-link";
import { Button } from "./ui/button";
import { IconGitHub } from "./ui/icons";

export function FooterText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "px-2 text-center text-xs leading-normal text-muted-foreground flex items-baseline",
        className
      )}
      {...props}
    >
      Open source math geometry AI generator <br />
      <Button asChild size="sm" variant="ghost">
        <a
          target="_blank"
          href="https://github.com/vercel-labs/gemini-chatbot"
          rel="noopener noreferrer"
        >
          <IconGitHub />
          <span className="hidden ml-2 md:flex">GitHub</span>
        </a>
      </Button>
    </p>
  );
}

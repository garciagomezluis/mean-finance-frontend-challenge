import { cn } from "@/lib/utils";
import { LucideCopy } from "lucide-react";
import React, { ComponentPropsWithoutRef } from "react";
import { useCopyToClipboard } from "react-use";
import { useToast } from "./ui/use-toast";

export function CopyButton<
  T extends ComponentPropsWithoutRef<typeof LucideCopy> & { text: string }
>({ text, className, ...props }: T) {
  const [state, copyToClipboard] = useCopyToClipboard();
  const { toast } = useToast();

  return (
    <LucideCopy
      className={cn(className)}
      onClick={() => {
        copyToClipboard(text);
        toast({
          title: "Copied!",
          description: text,
        });
      }}
      {...props}
    />
  );
}

import { Card } from "@/components/ui/card";
import React, { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InsightCard<
  T extends ComponentPropsWithoutRef<typeof Card> & {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    detail?: ReactNode;
  }
>({ title, icon, children, detail, className, ...props }: T) {
  return (
    <Card className={cn(className, "p-5 space-y-3")} {...props}>
      <div className="flex justify-between items-center">
        <p className="capitalize">{title}</p>
        {icon ? icon : null}
      </div>
      <div className="flex flex-col gap-2">
        {children}
        {detail ? detail : null}
      </div>
    </Card>
  );
}

import { cn } from "@/lib/utils";
import React from "react";

export default function DualPill({
  first,
  second,
  className = "",
}: {
  first: string;
  second: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex gap-1 rounded-md overflow-hidden text-bold text-xl",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(-70deg, #172554 49%, white 50%, white 50%, #ec4899 51%)",
      }}
    >
      <p className="p-1 flex-1 text-center text-white font-bold">{first}</p>
      <p className="p-1 flex-1 text-center text-white font-bold">{second}</p>
    </div>
  );
}

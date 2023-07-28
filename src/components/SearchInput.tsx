import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SearchInput({
  className = "",
}: {
  className?: string;
}) {
  const { address } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(address ?? "");
  }, []);

  function redirectHandler(targetAddress: string) {
    if (targetAddress.trim() === "") return;
    navigate(`/dashboard/${targetAddress}`);
  }

  return (
    <div className={cn("relative w-full max-w-[500px] h-[45px]", className)}>
      <Input
        className="rounded-xl pr-20 pl-5 py-1 text-md h-full bg-transparent focus:bg-white text-gray-200 focus:text-gray-700 transition-all"
        placeholder="0xe9ad36807e75ac3948fb068afbad983158c163f6"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            redirectHandler(value);
          }
        }}
      />
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-0 h-full rounded-r-xl rounded-l-none"
        onClick={() => redirectHandler(value)}
        aria-label="search"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { LucideExternalLink } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { Badge } from "./ui/badge";
import { cn, getAmountOptions } from "@/lib/utils";
import React from "react";
import { Link } from "react-router-dom";

export type AccountType = "eoa" | "contract";

export type AddressData = {
  address: string;
  shorter: string;
  ens: string | null;
  alias: string;
  link: string;
  type: AccountType;
};

export function AmountLabel({
  amount,
  symbol,
  signPrefix = false,
  className = "",
}: {
  amount: number;
  symbol: string;
  signPrefix?: boolean;
  className?: string;
}) {
  const { formattedAmountWithSymbol } = getAmountOptions(
    amount,
    symbol,
    signPrefix
  );

  return (
    <span title={`${amount} ${symbol}`} className={cn(className)}>
      {formattedAmountWithSymbol}
    </span>
  );
}

export function AddressBox({
  address,
  type,
  link,
}: Pick<AddressData, "address" | "type" | "link">) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 items-center">
        <p>{address}</p>
        <CopyButton text={address} size={15} className="cursor-pointer" />
        <Link to={link} target="_blank">
          <LucideExternalLink size={15} />
        </Link>
      </div>
      {type === "eoa" ? (
        <p>This address belongs to an EOA</p>
      ) : (
        <p>This address belongs to a Contract Account</p>
      )}
    </div>
  );
}

export function AddressLabel({
  address,
  type,
  link,
  alias,
  withAccountType = false,
  className = "",
}: Pick<AddressData, "address" | "type" | "link" | "alias"> & {
  withAccountType?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "flex gap-1 hover:bg-gray-300 hover:text-black px-1 rounded-md",
            withAccountType ? "pr-0" : "",
            className
          )}
        >
          <Link
            to={link}
            className="overflow-hidden whitespace-nowrap text-ellipsis"
          >
            {alias}
          </Link>
          {withAccountType ? (
            <Badge
              variant={type === "eoa" ? "default" : "secondary"}
              className="text-[10px] px-2 uppercase"
            >
              {type}
            </Badge>
          ) : null}
        </TooltipTrigger>
        <TooltipContent>
          <AddressBox address={address} type={type} link={link} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

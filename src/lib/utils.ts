import { Position } from "@/services/position-service";
import { clsx, type ClassValue } from "clsx";
import { addSeconds } from "date-fns";
import millify from "millify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBigInt(value: bigint, decimals: number) {
  const str = value.toString(); // Convert the BigInt to a string to avoid precision issues
  const len = str.length; // Get the length of the string

  if (len <= decimals) {
    // If the string is shorter than the decimal places, pad with zeroes
    const padded = str.padStart(decimals + 1, "0");
    return parseFloat("0." + padded.slice(0, decimals)); // ? We lose a bit of precision but its ok for now
  } else {
    // Else, insert a dot at the correct place
    return parseFloat(
      str.slice(0, len - decimals) + "." + str.slice(len - decimals)
    ); // We lose a bit of precision but its ok for now
  }
}

export function getAmountOptions(
  amount: number,
  symbol: string,
  signPrefix: boolean = false
) {
  const formattedAmount_ = millify(amount, { precision: 3 });

  let formattedAmount = formattedAmount_;

  if (
    !signPrefix &&
    amount !== 0 &&
    (formattedAmount_ === "-0" || formattedAmount_ === "0")
  )
    formattedAmount = "~0";

  if (signPrefix && amount > 0) formattedAmount = "+" + formattedAmount_;

  return {
    amount,
    formattedAmount,
    formattedAmountWithSymbol: `${formattedAmount} ${symbol}`,
  };
}

export function shorterAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
}

export function getPositionInsights(position: Position) {
  const remainingLiquidity = {
    amount: formatBigInt(position.remainingLiquidity, position.from.decimals),
    symbol: position.from.symbol,
  };

  const toWithdraw = {
    amount: formatBigInt(position.toWithdraw, position.to.decimals),
    symbol: position.to.symbol,
  };

  const swapped = {
    amount: position.swaps.reduce((prev, swap) => {
      return (
        prev + formatBigInt(swap.swapped ?? BigInt(0), position.to.decimals)
      );
    }, 0),
    symbol: position.to.symbol,
  };

  const allocation = {
    amount:
      remainingLiquidity.amount +
      position.swaps.reduce(
        (prev, current) =>
          prev + formatBigInt(current.rate, position.from.decimals),
        0
      ),
    symbol: position.from.symbol,
  };

  const rate = {
    amount: formatBigInt(position.rate, position.from.decimals),
    symbol: position.from.symbol,
  };

  const startingDate = position.swaps.length
    ? new Date(Number(position.swaps.at(-1)?.timestamp) * 1000)
    : null;

  const nextSwapDate =
    position.swaps.length && position.status === "ACTIVE"
      ? addSeconds(
          new Date(Number(position.swaps.at(0)?.timestamp) * 1000),
          Number(position.swapInterval)
        )
      : null;

  const endingDate = position.swaps.length
    ? addSeconds(
        new Date(Number(position.swaps.at(0)?.timestamp) * 1000),
        Number(position.remainingSwaps) * Number(position.swapInterval)
      )
    : null;

  return {
    allocation,
    remainingLiquidity,
    swapped,
    toWithdraw,
    rate,
    startingDate,
    nextSwapDate,
    endingDate,
  };
}

import React, { useEffect, useState } from "react";
import { getPositionInsights, shorterAddress } from "../lib/utils";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { usePositions } from "./../providers/positions";
import { AddressLabel, AmountLabel } from "./AddressLabel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatDistanceStrict } from "date-fns";
import Bear from "./../images/bear.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "react-use";
import { Skeleton } from "./ui/skeleton";
import DualPill from "./DualPill";

function SkeletonCard() {
  return (
    <Card className="lg:max-w-[300px]">
      <CardHeader>
        <CardTitle className="flex gap-2">
          <Skeleton className="w-full h-[36px]" />
        </CardTitle>
        <div className="flex gap-1">
          <Skeleton className="w-[100px] h-[24px]" />
          <Skeleton className="w-[75px] h-[24px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between my-1">
          <Skeleton className="w-full h-[24px]" />
        </div>
        <div className="flex justify-between my-1">
          <Skeleton className="w-full h-[24px]" />
        </div>
        <div className="flex justify-between my-1">
          <Skeleton className="w-full h-[24px]" />
        </div>
        <div className="flex justify-between my-1">
          <Skeleton className="w-full h-[24px]" />
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { address } = useParams();
  const { positions, tokens, loading, hasPendingChange } =
    usePositions(address);
  const [selectedToken, setSelectedToken] = useState("alltokens");
  const [selectedStatusType, setSelectedStatusType] = useState("allstatus");

  const [searchParams, setSearchParams] = useSearchParams();

  if (!address) return <div>not found</div>;

  useEffect(() => {
    const updatedSearchParams = new URLSearchParams(searchParams.toString());
    const token = updatedSearchParams.get("token");
    const status = updatedSearchParams.get("status");

    setSelectedToken(token ?? "alltokens");
    setSelectedStatusType(status ?? "allstatus");
  }, []);

  useDebounce(
    () => {
      let updatedSearchParams = new URLSearchParams();

      if (selectedToken !== "alltokens") {
        updatedSearchParams.set("token", selectedToken);
      }

      if (selectedStatusType !== "allstatus") {
        updatedSearchParams.set("status", selectedStatusType);
      }

      setSearchParams(updatedSearchParams.toString());
    },
    200,
    [selectedToken, selectedStatusType]
  );

  const filtered = positions.filter((position) => {
    const tokenFiltering =
      selectedToken === "alltokens" ||
      position.from.symbol === selectedToken ||
      position.to.symbol === selectedToken;

    const statusFiltering =
      selectedStatusType === "allstatus" ||
      position.status.toLowerCase() === selectedStatusType;

    return tokenFiltering && statusFiltering;
  });

  return (
    <div className="grid gap-10">
      <div>
        <AddressLabel
          address={address}
          type="eoa"
          link=""
          alias={shorterAddress(address)}
          className="text-3xl font-bold bg-white"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {!loading ? (
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alltokens">All tokens</SelectItem>
                {Object.values(tokens).map(({ symbol }) => (
                  <SelectItem value={symbol} key={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Skeleton className="md:w-[180px] h-[40px]" />
          )}
          {!loading ? (
            <Select
              value={selectedStatusType}
              onValueChange={setSelectedStatusType}
            >
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allstatus">All status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Skeleton className="md:w-[180px] h-[40px]" />
          )}
        </div>
      </Card>

      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col justify-center items-center">
          <p className="text-lg p-5 bg-white font-bold rounded-lg">No items found</p>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array(8)
              .fill("")
              .map((e, i) => <SkeletonCard key={i} />)
          : null}
        {!loading &&
          filtered.map((position) => {
            const { allocation, remainingLiquidity, swapped, toWithdraw } =
              getPositionInsights(position);

            const isPending = hasPendingChange(position.id);

            return (
              <Link
                to={`/dashboard/${address}/${position.id}`}
                className="hover:shadow-xl"
                key={position.id}
              >
                <Card className="lg:max-w-[300px] relative overflow-hidden border-none">
                  {isPending ? (
                    <p className="p-[2px] text-center text-xs text-white bg-black absolute inset-x-0 bottom-0">
                      Pending operation
                    </p>
                  ) : null}
                  <CardHeader>
                    <CardTitle className="flex gap-2">
                      <DualPill
                        first={position.from.symbol}
                        second={position.to.symbol}
                      />
                    </CardTitle>
                    <div className="flex gap-1">
                      <Badge
                        variant={
                          position.status !== "COMPLETED"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {position.status}
                      </Badge>
                      <Badge variant="outline">
                        {formatDistanceStrict(
                          0,
                          Number(position.swapInterval) * 1000,
                          {
                            roundingMethod: "ceil",
                          }
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between my-1">
                      <p>Allocated</p>
                      <AmountLabel
                        amount={allocation.amount}
                        symbol={allocation.symbol}
                      />
                    </div>
                    <div className="flex justify-between my-1">
                      <p>To swap</p>
                      <AmountLabel
                        amount={remainingLiquidity.amount}
                        symbol={remainingLiquidity.symbol}
                      />
                    </div>
                    <div className="flex justify-between my-1">
                      <p>Bought</p>
                      <AmountLabel
                        amount={swapped.amount}
                        symbol={swapped.symbol}
                      />
                    </div>
                    <div className="flex justify-between my-1">
                      <p>To withdraw</p>
                      <AmountLabel
                        amount={toWithdraw.amount}
                        symbol={toWithdraw.symbol}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

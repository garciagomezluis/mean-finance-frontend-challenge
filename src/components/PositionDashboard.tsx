import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  formatBigInt,
  getPositionInsights,
  shorterAddress,
} from "../lib/utils";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import addSeconds from "date-fns/addSeconds";
import { usePositions } from "./../providers/positions";
import { AddressLabel, AmountLabel } from "./AddressLabel";
import { Badge } from "./ui/badge";
import DualPill from "./DualPill";
import { InsightCard } from "./InsightCard";
import {
  LucideActivity,
  LucideArrowLeftRight,
  LucideCalendar,
  LucideDollarSign,
  LucideForward,
  LucideWaves,
} from "lucide-react";
import { formatDistance, subSeconds } from "date-fns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  LineChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
} from "recharts";
import millify from "millify";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";

function usePositionManager(address?: string, positionId?: string) {
  const {
    positions,
    withdraw,
    close,
    addFunds,
    hasPendingChange,
    tokens,
    loading,
  } = usePositions(address);
  const [selectedPositionId, setSelectedPositionId] = useState(positionId);

  const { toast } = useToast();

  useEffect(() => setSelectedPositionId(positionId), [positionId]);

  // useEffect(() => setSelectedPositionId(undefined), [positions]);

  const position = positions.find(
    (position) => position.id === selectedPositionId
  );

  return {
    positions,
    position,
    tokens,
    loading,
    withdraw: () => {
      position && withdraw(position.id);
      toast({
        title: "Operation",
        description: "Your withdraw operation is being processed",
      });
    },
    close: () => {
      position && close(position.id);
      toast({
        title: "Operation",
        description: "Your close operation is being processed",
      });
    },
    addFunds: (amount: number) => {
      position && addFunds(position.id, amount);
      toast({
        title: "Operation",
        description: "Your funds are being added",
      });
    },
    hasPendingChange: () => position && hasPendingChange(position.id),
  };
}

function DashboardSkeleton({ address }: { address: string }) {
  return (
    <div className="grid gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row gap-2 md:justify-between items-center">
          <div className="flex flex-col lg:flex-row gap-2">
            <AddressLabel
              address={address}
              type="eoa"
              link={`/dashboard/${address}`}
              alias={shorterAddress(address)}
              className="text-3xl font-bold bg-white"
            />
            <Skeleton className="w-72 md:h-[36px]" />
          </div>
          <div className="flex gap-2 w-full max-w-[18rem] h-[40px]">
            <Skeleton className="flex-1 h-full" />
            <Skeleton className="flex-1 h-full" />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-between items-center">
          <div className="flex gap-1">
            <div>
              <Skeleton className="w-[100px] h-[24px]" />
            </div>
            <div>
              <Skeleton className="w-[75px] h-[24px]" />
            </div>
          </div>
          <Skeleton className="w-full max-w-[18rem] h-[40px]" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array(8)
          .fill("")
          .map(() => (
            <Card className={"p-5 space-y-3"}>
              <div className="flex justify-between items-center">
                <Skeleton className="h-[23px] w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-[34px] w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-[15px] w-full" />
              </div>
            </Card>
          ))}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-[24px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-white rounded-md">
            <Skeleton className="h-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PositionDashboard() {
  const [fundsToAdd, setFundsToAdd] = useState(0);

  const { address, positionId } = useParams();

  const {
    position,
    withdraw,
    close,
    addFunds,
    hasPendingChange,
    tokens,
    loading,
  } = usePositionManager(address, positionId);

  if (!address || !positionId) return <div>not found</div>;

  if (loading) {
    return <DashboardSkeleton address={address} />;
  }

  if (!position) return <div>position not found</div>;

  const {
    allocation,
    remainingLiquidity,
    swapped,
    toWithdraw,
    rate,
    startingDate,
    nextSwapDate,
    endingDate,
  } = getPositionInsights(position);

  const isPending = hasPendingChange();
  const disableActions = position.status === "COMPLETED" || isPending;

  let timeseries: {
    swapped?: number;
    date: string;
    rate?: number;
    total: number;
  }[] = [];

  if (startingDate && endingDate) {
    timeseries = [
      ...Array(2)
        .fill("")
        .map((e, i) => ({
          swapped: BigInt(0),
          timestamp: Math.floor(
            subSeconds(
              startingDate,
              Number(position.swapInterval) * (i + 1)
            ).getTime() / 1000
          ),
          rate: BigInt(0),
        })),
      ...[...position.swaps].reverse(),
      ...Array(Number(position.remainingSwaps))
        .fill("")
        .map((e, i) => ({
          swapped: BigInt(0),
          timestamp: Math.floor(
            addSeconds(
              new Date(Number(position.swaps[0].timestamp) * 1000),
              Number(position.swapInterval) * (i + 1)
            ).getTime() / 1000
          ),
          rate: position.rate,
        })),
      ...Array(2)
        .fill("")
        .map((e, i) => ({
          swapped: BigInt(0),
          timestamp: Math.floor(
            addSeconds(
              new Date(Number(position.swaps[0].timestamp) * 1000),
              Number(position.swapInterval) *
                (Number(position.remainingSwaps) + i + 1)
            ).getTime() / 1000
          ),
          rate: BigInt(0),
        })),
    ]
      .map((swap) => {
        return {
          ...swap,
          swapped: formatBigInt(swap.swapped, position.to.decimals),
          rate: formatBigInt(swap.rate, position.from.decimals),
          timestamp: Number(swap.timestamp) * 1000,
        };
      })
      .reduce((prev, swap) => {
        return [
          ...prev,
          {
            ...swap,
            swapped:
              swap.timestamp > (nextSwapDate?.getTime() || endingDate.getTime())
                ? 0
                : (prev.at(-1)?.swapped ?? 0) + swap.swapped,
            total: (prev.at(-1)?.total ?? 0) + swap.rate,
            date: new Date(swap.timestamp).toLocaleString(),
          },
        ];
      }, [] as { swapped?: number; date: string; rate?: number; total: number }[]);
  }

  return (
    <div className="grid gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row gap-2 md:justify-between items-center">
          <div className="flex flex-col lg:flex-row gap-2">
            <AddressLabel
              address={address}
              type="eoa"
              link={`/dashboard/${address}`}
              alias={shorterAddress(address)}
              className="text-3xl font-bold bg-white"
            />
            <DualPill
              first={position.from.symbol}
              second={position.to.symbol}
              className="w-72"
            />
          </div>
          <div className="flex gap-2 w-full max-w-[18rem] h-[40px]">
            <Button
              type="button"
              size="sm"
              className="flex-1 h-full"
              disabled={disableActions || toWithdraw.amount === 0}
              onClick={withdraw}
            >
              Withdraw
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 h-full"
              disabled={disableActions}
              variant="secondary"
              onClick={close}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-between items-center">
          <div className="flex gap-1">
            <div>
              <Badge
                variant={
                  position.status !== "COMPLETED" ? "secondary" : "default"
                }
              >
                {position.status}
              </Badge>
            </div>
            <div>
              <Badge variant="outline" className="bg-white">
                {formatDistanceStrict(0, Number(position.swapInterval) * 1000, {
                  roundingMethod: "ceil",
                })}
              </Badge>
            </div>
          </div>
          <form className="relative w-full max-w-[18rem] h-[40px]">
            <Input
              className="rounded-md pr-40 pl-5 py-1 text-md h-full bg-transparent text-gray-200"
              type="number"
              min={0}
              disabled={disableActions}
              placeholder="0xe9ad36807e75ac3948fb068afbad983158c163f6"
              value={fundsToAdd}
              onChange={(e) => setFundsToAdd(Number(e.currentTarget.value))}
            />
            <Button
              type="button"
              size="sm"
              className="absolute right-0 top-0 h-full rounded-r-md rounded-l-none w-36"
              disabled={disableActions || fundsToAdd === 0}
              variant="secondary"
              onClick={() => addFunds(fundsToAdd)}
            >
              Add funds
            </Button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <InsightCard
          title="Total Allocation"
          icon={<LucideDollarSign size={20} />}
          detail={
            <p className="text-xs text-muted-foreground flex gap-1">
              Estimated fiat amount:{" "}
              <AmountLabel
                amount={tokens[position.from.address].price * allocation.amount}
                symbol={"USD"}
              />
            </p>
          }
        >
          <AmountLabel
            className="text-3xl font-bold"
            amount={allocation.amount}
            symbol={allocation.symbol}
          />
        </InsightCard>

        <InsightCard
          title="Remaining Liquidity"
          icon={<LucideWaves size={20} />}
          detail={
            <p className="text-xs text-muted-foreground flex gap-1">
              Estimated fiat amount:{" "}
              <AmountLabel
                amount={
                  tokens[position.from.address].price *
                  remainingLiquidity.amount
                }
                symbol={"USD"}
              />
            </p>
          }
        >
          <AmountLabel
            className="text-3xl font-bold"
            amount={remainingLiquidity.amount}
            symbol={remainingLiquidity.symbol}
          />
        </InsightCard>

        <InsightCard
          title="Bought"
          icon={<LucideArrowLeftRight size={20} />}
          detail={
            <p className="text-xs text-muted-foreground flex gap-1">
              Estimated fiat amount:{" "}
              <AmountLabel
                amount={tokens[position.to.address].price * swapped.amount}
                symbol={"USD"}
              />
            </p>
          }
        >
          <AmountLabel
            className="text-3xl font-bold"
            amount={swapped.amount}
            symbol={swapped.symbol}
          />
        </InsightCard>

        <InsightCard
          title="To withdraw"
          icon={<LucideForward size={20} />}
          detail={
            <p className="text-xs text-muted-foreground flex gap-1">
              Estimated fiat amount:{" "}
              <AmountLabel
                amount={tokens[position.to.address].price * toWithdraw.amount}
                symbol={"USD"}
              />
            </p>
          }
        >
          <AmountLabel
            className="text-3xl font-bold"
            amount={toWithdraw.amount}
            symbol={toWithdraw.symbol}
          />
        </InsightCard>

        <InsightCard
          title="Rate"
          icon={<LucideActivity size={20} />}
          detail={
            <p className="text-xs text-muted-foreground flex gap-1">
              {Math.round(
                ((position.swaps?.length ?? 0) / Number(position.totalSwaps)) *
                  100
              )}
              % of total swaps ({position.swaps?.length ?? 0}/
              {Number(position.totalSwaps)})
            </p>
          }
        >
          <AmountLabel
            className="text-3xl font-bold"
            amount={rate.amount}
            symbol={rate.symbol}
          />
        </InsightCard>

        {startingDate ? (
          <InsightCard
            title="Starting date"
            icon={<LucideCalendar size={20} />}
            detail={
              <p className="text-xs text-muted-foreground flex gap-1">
                {formatDistance(startingDate, new Date(), { addSuffix: true })}
              </p>
            }
          >
            <div className="flex gap-1 items-end">
              <p className="text-3xl font-bold">
                {startingDate.toLocaleDateString()}
              </p>
              <p className="text-xl font-bold">
                {startingDate.toLocaleTimeString()}
              </p>
            </div>
          </InsightCard>
        ) : null}

        {nextSwapDate ? (
          <InsightCard
            title="Next swap date"
            icon={<LucideCalendar size={20} />}
            detail={
              <p className="text-xs text-muted-foreground flex gap-1">
                {formatDistance(nextSwapDate, new Date(), { addSuffix: true })}
              </p>
            }
          >
            <div className="flex gap-1 items-end">
              <p className="text-3xl font-bold">
                {nextSwapDate.toLocaleDateString()}
              </p>
              <p className="text-xl font-bold">
                {nextSwapDate.toLocaleTimeString()}
              </p>
            </div>
          </InsightCard>
        ) : null}

        {endingDate ? (
          <InsightCard
            title="Ending date"
            icon={<LucideCalendar size={20} />}
            detail={
              <p className="text-xs text-muted-foreground flex gap-1">
                {formatDistance(endingDate, new Date(), { addSuffix: true })}
              </p>
            }
          >
            <div className="flex gap-1 items-end">
              <p className="text-3xl font-bold">
                {endingDate.toLocaleDateString()}
              </p>
              <p className="text-xl font-bold">
                {endingDate.toLocaleTimeString()}
              </p>
            </div>
          </InsightCard>
        ) : null}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Liquidity usage over time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-white rounded-md">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                height={300}
                data={timeseries}
                margin={{
                  right: 40,
                  left: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
                <YAxis
                  padding={{ top: 30, bottom: 10 }}
                  tickFormatter={(value) =>
                    `${millify(value, { precision: 2 })}${position.from.symbol}`
                  }
                />
                <Tooltip
                  content={(a: any) => {
                    const {
                      payload: [payload],
                    } = a;
                    return (
                      <div className="bg-white p-3 text-sm border rounded-sm h-full overflow-y-scroll pointer-events-auto">
                        <div className="flex flex-col gap-3">
                          <div>{payload?.payload?.date}</div>
                          <div className="flex justify-between gap-2">
                            Total Sold:{" "}
                            <p>
                              {payload?.payload?.total} {position.from.symbol}
                            </p>
                          </div>
                          {payload?.payload?.swapped ? (
                            <div className="flex justify-between gap-2">
                              Total Bought:{" "}
                              <p>
                                {payload?.payload?.swapped} {position.to.symbol}
                              </p>
                            </div>
                          ) : null}
                          {payload?.payload?.rate ? (
                            <div className="flex justify-between gap-2">
                              Swap cost:{" "}
                              <p>
                                {payload?.payload?.rate} {position.from.symbol}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={timeseries.find(({ rate }) => rate)?.date}
                  stroke="#f00"
                  label={<Label value="Starting" position="insideRight" />}
                />
                {nextSwapDate ? (
                  <ReferenceLine
                    x={nextSwapDate.toLocaleString()}
                    stroke="#f00"
                    label={
                      <Label value="Next Swap" position="insideBottomRight" />
                    }
                  />
                ) : null}
                <ReferenceLine
                  x={timeseries.findLast(({ rate }) => rate)?.date}
                  stroke="#f00"
                  label={<Label value="Ending" position="insideTopLeft" />}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#31508b"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

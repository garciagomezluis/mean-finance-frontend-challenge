import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatBigInt } from "../lib/utils";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import addSeconds from "date-fns/addSeconds";
import { usePositions } from "./../providers/positions";

function usePositionManager(address?: string, positionId?: string) {
  const { positions, withdraw, close, addFunds, hasPendingChange } =
    usePositions(address);
  const [selectedPositionId, setSelectedPositionId] = useState(positionId);

  useEffect(() => setSelectedPositionId(positionId), [positionId]);

  // useEffect(() => setSelectedPositionId(undefined), [positions]);

  const position = positions.find(
    (position) => position.id === selectedPositionId
  );

  return {
    positions,
    position,
    withdraw: () => position && withdraw(position.id),
    close: () => position && close(position.id),
    addFunds: (amount: number) => position && addFunds(position.id, amount),
    hasPendingChange: () => position && hasPendingChange(position.id),
  };
}

export function PositionDashboard() {
  const [fundsToAdd, setFundsToAdd] = useState(0);

  const { address, positionId } = useParams();

  const { position, withdraw, close, addFunds, hasPendingChange } =
    usePositionManager(address, positionId);

  if (!address || !positionId) return <div>not found</div>;

  if (!position) return <div>position not found</div>;

  // console.log(formatBigInt(position.rate, position.from.decimals));

  return (
    <div>
      {hasPendingChange() ? <p style={{background: "yellow", color: "black", padding: 5}}>PENDING</p> : null}
      {address} - {positionId}
      <p>
        rate {position.from.symbol}{" "}
        {formatBigInt(position.rate, position.from.decimals)}
      </p>
      <p>
        remaining liquidity {position.from.symbol}{" "}
        {formatBigInt(position.remainingLiquidity, position.from.decimals)}
      </p>
      <p>
        towithdraw {position.to.symbol}{" "}
        {formatBigInt(position.toWithdraw, position.to.decimals)}
      </p>
      <p>
        interval{" "}
        {formatDistanceStrict(0, Number(position.swapInterval) * 1000, {
          roundingMethod: "ceil",
        })}
      </p>
      <p>
        {((Number(position.totalSwaps) - Number(position.remainingSwaps)) /
          Number(position.totalSwaps)) *
          100}
        % of total swaps (
        {Number(position.totalSwaps) - Number(position.remainingSwaps)}/
        {Number(position.totalSwaps)})
      </p>
      {position.swaps.length !== 0 ? (
        <p>
          Next swap:{" "}
          {addSeconds(
            new Date(Number(position.swaps[0].timestamp) * 1000),
            Number(position.swapInterval)
          ).toLocaleString()}
        </p>
      ) : null}

      <form>

        <input type="number" value={fundsToAdd} onChange={(e) => setFundsToAdd(Number(e.currentTarget.value))} />

        <button type="button" onClick={withdraw}>
          Withdraw
        </button>
        <button type="button" onClick={close}>
          Close
        </button>
        <button type="button" onClick={() => addFunds(fundsToAdd)}>
          Add funds
        </button>
      </form>
    </div>
  );
}

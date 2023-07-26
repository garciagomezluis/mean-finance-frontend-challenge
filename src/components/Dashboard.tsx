import React from "react";
import { formatBigInt } from "../lib/utils";
import { Link, useParams } from "react-router-dom";
import { usePositions } from "./../providers/positions";

export function Dashboard() {
  const { address } = useParams();
  const { positions, tokenPrices } = usePositions(address);

  if(!address) return <div>not found</div>;

  return (
    <div className="bg-red-200">
      <p>User {address}</p>

      {positions.map((position) => {
        const amountToSwap = formatBigInt(position.remainingLiquidity, position.from.decimals);
        const amountSwapped = formatBigInt(position.toWithdraw, position.to.decimals);
        const allocation = tokenPrices[position.from.address] * amountToSwap + tokenPrices[position.to.address] * amountSwapped;

        return (
          <Link to={`/dashboard/${address}/${position.id}`} key={position.id} style={{ padding: 10, margin: 10, backgroundColor: "lightblue", display: "block", color: "black" }}>
            <p>To swap: {position.from.symbol} {amountToSwap}</p>
            <p>Swapped: {position.to.symbol} {amountSwapped}</p>
            <p>Allocated: USD {allocation}</p>
          </Link>
        );
      })}
    </div>
  );
}

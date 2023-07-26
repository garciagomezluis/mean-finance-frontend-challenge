import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import PositionService, { Position } from "./../services/position-service";

const positionService = new PositionService();

const Context = createContext<{
  positions: Position[];
  tokenPrices: Record<string, number>;
  withdraw: (id: string) => Promise<string>;
  close: (id: string) => Promise<string>;
  addFunds: (id: string, amount: number) => Promise<string>;
  setAddress: (address?: string) => void;
  hasPendingChange: (id: string) => boolean;
}>({
  positions: [],
  tokenPrices: {},
  withdraw: () => Promise.resolve(""),
  close: () => Promise.resolve(""),
  addFunds: () => Promise.resolve(""),
  setAddress: () => {},
  hasPendingChange: () => false,
});

export const usePositions = (address?: string) => {
  const { setAddress, ...others } = useContext(Context);

  useEffect(() => setAddress(address), [address]);

  return others;
};

export default function PositionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [address, setAddress] = useState<string>();
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { position: Position; modificationId: string }>
  >({});

  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!address) return;

    positionService.fetchCurrentPositions(address).then(async (positions) => {
      const tokens = [
        ...new Set(
          positions.reduce(
            (prev, { from, to }) => [...prev, from.address, to.address],
            []
          )
        ),
      ];

      const tokenPrices = await positionService.getUsdPrice(tokens);

      setTokenPrices(tokenPrices);
      setPositions(positions);
    });
  }, [address]);

  useEffect(() => {
    clearTimeout(retryTimeoutRef.current);

    retryTimeoutRef.current = setTimeout(async () => {
      const pending = Object.values(pendingChanges);
      const statuses = await Promise.all(
        pending.map(({ modificationId }) =>
          positionService.getPositionTransactionStatus(modificationId)
        )
      );

      //   console.log(statuses, "**");

      setPendingChanges(() =>
        pending.reduce((prev, current, idx) => {
          if (statuses[idx] === "PENDING") {
            return {
              ...prev,
              [current.position.id]: current,
            };
          }

          return prev;
        }, {})
      );

      setPositions((positions) => {
        return positions.map((position, idx) => {
          const pendingIdx = pending.findIndex(
            (e) => e.position.id === position.id
          );

          if (pendingIdx !== -1 && statuses[pendingIdx] === "SUCCESS") {
            return pending[pendingIdx].position;
          }

          return position;
        });
      });
    }, 1000);
  }, [pendingChanges]);

  function hasPendingChange(id: string) {
    return typeof pendingChanges[id] !== "undefined";
  }

  async function withdraw(id: string) {
    const position = positions.find((position) => position.id === id);

    if (!position) throw new Error("Invalid position");

    const modificationId = await positionService.modifyPosition();

    setPendingChanges((prev) => ({
      ...prev,
      [id]: {
        position: { ...position, toWithdraw: BigInt(0) },
        modificationId,
      },
    }));

    return "";
  }

  async function close(id: string) {
    const position = positions.find((position) => position.id === id);

    if (!position) throw new Error("Invalid position");

    const modificationId = await positionService.modifyPosition();

    setPendingChanges((prev) => ({
      ...prev,
      [id]: {
        position: { ...position, rate: BigInt(0), toWithdraw: BigInt(0) },
        modificationId,
      },
    }));

    return "";
  }

  async function addFunds(id: string, amount: number) {
    const position = positions.find((position) => position.id === id);

    if (!position) throw new Error("Invalid position");

    const modificationId = await positionService.modifyPosition();

    const amountAsBigInt = BigInt(amount * Math.pow(10, position.from.decimals));

    setPendingChanges((prev) => ({
      ...prev,
      [id]: {
        position: {
          ...position,
          remainingLiquidity: position.remainingLiquidity + amountAsBigInt,
          rate: (position.remainingLiquidity + amountAsBigInt) / position.remainingSwaps,
        },
        modificationId,
      },
    }));

    return "";
  }

  return (
    <Context.Provider
      value={{
        positions: positions.map((e) => pendingChanges[e.id]?.position || e),
        tokenPrices,
        withdraw,
        close,
        addFunds,
        setAddress,
        hasPendingChange,
      }}
    >
      {children}
    </Context.Provider>
  );
}

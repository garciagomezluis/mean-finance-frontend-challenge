import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import PositionService, { Position } from "./../services/position-service";
import { useInterval } from "react-use";
import { useToast } from "@/components/ui/use-toast";

const positionService = new PositionService();

const Context = createContext<{
  positions: Position[];
  loading: boolean;
  tokens: Record<string, { price: number; symbol: string }>;
  withdraw: (id: string) => Promise<string>;
  close: (id: string) => Promise<string>;
  addFunds: (id: string, amount: number) => Promise<string>;
  setAddress: (address?: string) => void;
  hasPendingChange: (id: string) => boolean;
}>({
  positions: [],
  loading: true,
  tokens: {},
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
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<
    Record<string, { price: number; symbol: string }>
  >({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { position: Position; modificationId: string }>
  >({});

  const { toast } = useToast();

  useEffect(() => {
    if (!address) return;

    setLoading(true);
    positionService
      .fetchCurrentPositions(address)
      .then(async (positions) => {
        const symbols: Record<string, string> = {};

        const tokens = [
          ...new Set(
            positions.reduce((prev, { from, to }) => {
              symbols[from.address] = from.symbol;
              symbols[to.address] = to.symbol;
              return [...prev, from.address, to.address];
            }, [])
          ),
        ];

        const tokenPrices = await positionService.getUsdPrice(tokens);

        setTokens(
          Object.entries(tokenPrices).reduce(
            (prev, [tokenAddress, tokenPrice]) => {
              return {
                ...prev,
                [tokenAddress]: {
                  price: tokenPrice,
                  symbol: symbols[tokenAddress],
                },
              };
            },
            {}
          )
        );
        setPositions(positions);
      })
      .finally(() => setLoading(false));
  }, [address]);

  // useEffect(() => {
  //   clearTimeout(retryTimeoutRef.current);

  //   retryTimeoutRef.current = setTimeout(async () => {

  //   }, 1000);
  // }, [pendingChanges]);

  useInterval(async () => {
    const pending = Object.values(pendingChanges);
    const statuses = await Promise.all(
      pending.map(({ modificationId }) =>
        positionService.getPositionTransactionStatus(modificationId)
      )
    );

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
          toast({
            title: "Operation Success",
            description: `Position ${pending[pendingIdx].position.from.symbol} - ${pending[pendingIdx].position.to.symbol} was modified`,
          });
          return pending[pendingIdx].position;
        }

        if (pendingIdx !== -1 && statuses[pendingIdx] === "FAILURE") {
          toast({
            title: "Operation Failure",
            description: `Position ${pending[pendingIdx].position.from.symbol} - ${pending[pendingIdx].position.to.symbol} could not be modified. Please retry.`,
          });
        }

        return position;
      });
    });
  }, 5000);

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
        position: {
          ...position,
          rate: BigInt(0),
          remainingLiquidity: BigInt(0),
          toWithdraw: BigInt(0),
          remainingSwaps: BigInt(0),
          status: "COMPLETED",
        },
        modificationId,
      },
    }));

    return "";
  }

  async function addFunds(id: string, amount: number) {
    const position = positions.find((position) => position.id === id);

    if (!position) throw new Error("Invalid position");

    const modificationId = await positionService.modifyPosition();

    const amountAsBigInt = BigInt(
      amount * Math.pow(10, position.from.decimals)
    );

    setPendingChanges((prev) => ({
      ...prev,
      [id]: {
        position: {
          ...position,
          remainingLiquidity: position.remainingLiquidity + amountAsBigInt,
          rate:
            (position.remainingLiquidity + amountAsBigInt) /
            position.remainingSwaps,
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
        loading,
        tokens,
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

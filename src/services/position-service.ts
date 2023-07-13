import GET_POSITIONS from '../graphql/getPositions.graphql';
import axios, { AxiosInstance } from 'axios';

import gqlFetchAll from '../utils/gqlFetchAll';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import TransactionService from './transaction-service';

interface PositionsGraphqlResponse {
  positions: PositionResponse[];
}

type PositionResponse = {
  id: string;
  from: {
    decimals: number;
    address: string;
    name: string;
    symbol: string;
  };
  to: {
    decimals: number;
    address: string;
    name: string;
    symbol: string;
  };
  user: string;
  status: string;
  swapInterval: {
    interval: string;
  };
  remainingSwaps: string;
  remainingLiquidity: string;
  toWithdraw: string;
  rate: string;
  totalSwaps: string;
  history: {
    id: string;
    action: string;
    createdAtTimestamp: string;
    swapped: string;
    rate: string;
  }[];
};

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class PositionService {
  apolloClient: ApolloClient<NormalizedCacheObject>;

  axiosClient: AxiosInstance;

  transactionService: TransactionService;

  constructor() {
    this.apolloClient = new ApolloClient({
      uri: 'https://api.thegraph.com/subgraphs/name/mean-finance/dca-v2-yf-polygon',
      cache: new InMemoryCache(),
    });

    this.axiosClient = axios.create();

    this.transactionService = new TransactionService();
  }

  async fetchCurrentPositions(address: string) {
    const results = await gqlFetchAll<PositionsGraphqlResponse>(
      this.apolloClient,
      GET_POSITIONS,
      {
        address: address,
      },
      'positions'
    );

    return (
      results.data?.positions.map((position: PositionResponse) => ({
        from: position.from,
        to: position.to,
        user: position.user,
        swapInterval: BigInt(position.swapInterval.interval),
        rate: BigInt(position.rate),
        remainingLiquidity: BigInt(position.remainingLiquidity),
        remainingSwaps: BigInt(position.remainingSwaps),
        toWithdraw: BigInt(position.toWithdraw),
        totalSwaps: BigInt(position.totalSwaps),
        id: position.id,
        status: position.status,
        swaps: position.history.map((swap) => ({
          swapped: BigInt(swap.swapped),
          timestamp: swap.createdAtTimestamp,
          rate: BigInt(swap.rate),
        })),
      })) || []
    );
  }

  async getPositionTransactionStatus(id: string) {
    return this.transactionService.fetchTransaction(id);
  }

  async modifyPosition() {
    await timeout(200);

    return this.transactionService.addTransaction();
  }

  async getUsdPrice(tokenAddresses: string[], date?: number) {
    const defillamaTokens = tokenAddresses.map((address) => `polygon:${address}`).join(',');

    const price = await this.axiosClient.get<{ coins: Record<string, { price: number }> }>(
      date
        ? `https://coins.llama.fi/prices/historical/${date}/${defillamaTokens}`
        : `https://coins.llama.fi/prices/current/${defillamaTokens}`
    );

    const tokensPrices = tokenAddresses
      .filter(
        (address) =>
          price.data.coins && price.data.coins[`polygon:${address}`] && price.data.coins[`polygon:${address}`].price
      )
      .reduce<Record<string, number>>(
        (acc, address) => ({
          ...acc,
          [address]: price.data.coins[`polygon:${address}`].price,
        }),
        {}
      );

    return tokensPrices;
  }
}

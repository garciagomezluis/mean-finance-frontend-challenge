import gql from 'graphql-tag';

const getCurrentPositions = gql`
  query getCurrentPositions(
    $address: String!
    $first: Int
    $lastId: String
    $status: [String]
    $subgraphError: String
  ) {
    positions(
      orderDirection: desc
      orderBy: createdAtTimestamp
      where: { id_gt: $lastId, user: $address, status_in: [ACTIVE, COMPLETED] }
      first: $first
      subgraphError: $subgraphError
    ) {
      id
      totalSwaps
      user
      from {
        address: id
        decimals
        name
        symbol
      }
      to {
        address: id
        decimals
        name
        symbol
      }
      status
      swapInterval {
        id
        interval
      }
      rate
      remainingSwaps
      remainingLiquidity
      toWithdraw
      history(
        orderBy: createdAtBlock
        orderDirection: desc
        first: 1000
        subgraphError: $subgraphError
        where: { action: SWAPPED }
      ) {
        id
        action
        createdAtTimestamp
        ... on SwappedAction {
          swapped
          rate
        }
      }
    }
  }
`;

export default getCurrentPositions;

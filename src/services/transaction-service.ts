import { v4 as uuidv4 } from 'uuid';

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STATUS: Record<number, string> = {
  0: 'PENDING',
  1: 'SUCCESS',
  2: 'FAILURE',
};

export default class TransactionService {
  transactions: Record<string, string>;

  constructor() {
    this.transactions = {};
  }

  async fetchTransaction(id: string) {
    await timeout(200);

    if (!this.transactions[id]) {
      throw new Error('Transaction not found');
    }

    if (this.transactions[id] === 'PENDING') {
      const newStatus = Math.round(Math.random() * 2);

      this.transactions[id] = STATUS[newStatus];
    }

    return this.transactions[id];
  }

  addTransaction() {
    const newId = uuidv4();

    this.transactions[newId] = 'PENDING';

    return newId;
  }
}

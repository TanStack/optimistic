import { createDeferred } from "./deferred"
import type { Deferred } from "./deferred"
import type {
  PendingMutation,
  TransactionConfig,
  TransactionState,
} from "./types"

function generateUUID() {
  // Check if crypto.randomUUID is available (modern browsers and Node.js 15+)
  if (
    typeof crypto !== `undefined` &&
    typeof crypto.randomUUID === `function`
  ) {
    return crypto.randomUUID()
  }

  // Fallback implementation for older environments
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === `x` ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function createTransaction({
  id,
  mutationFn,
  metadata,
}: TransactionConfig): Transaction {
  if (typeof mutationFn === `undefined`) {
    throw `mutationFn is required when creating a transaction`
  }

  let transactionId = id
  if (!transactionId) {
    transactionId = generateUUID()
  }
  return new Transaction({ id: transactionId, mutationFn, metadata })
}

let transactionStack: Array<Transaction> = []

export function getActiveTransaction(): Transaction | undefined {
  if (transactionStack.length > 0) {
    return transactionStack.slice(-1)[0]
  } else {
    return undefined
  }
}

function registerTransaction(tx: Transaction) {
  transactionStack.push(tx)
}

function unregisterTransaction(tx: Transaction) {
  transactionStack = transactionStack.filter((t) => t.id !== tx.id)
}

export class Transaction {
  public id: string
  public state: TransactionState
  public mutationFn
  public mutations: Array<PendingMutation<any>>
  public isPersisted: Deferred<Transaction>
  public autoCommit: boolean
  public createdAt: Date
  constructor({ id, mutationFn, autoCommit = true }: TransactionConfig) {
    this.id = id!
    this.mutationFn = mutationFn
    this.state = `pending`
    this.mutations = []
    this.isPersisted = createDeferred()
    this.autoCommit = autoCommit
    this.createdAt = new Date()
  }

  setState(newState: TransactionState) {
    this.state = newState
  }

  mutate(callback: () => void): Transaction {
    if (this.state !== `pending`) {
      throw `You can no longer call .mutate() as the transaction is no longer pending`
    }

    registerTransaction(this)
    try {
      callback()
    } finally {
      unregisterTransaction(this)
    }

    if (this.autoCommit) {
      return this.commit()
    }

    return this
  }

  rollback(): Transaction {
    if (this.state === `completed`) {
      throw `You can no longer call .rollback() as the transaction is already completed`
    }

    return this
  }

  commit(): Transaction {
    if (this.state !== `pending`) {
      throw `You can no longer call .commit() as the transaction is no longer pending`
    }

    this.setState(`persisting`)

    if (this.mutations.length === 0) {
      this.setState(`completed`)
    }

    // Run mutationFn
    this.mutationFn({ transaction: this, mutations: this.mutations }).then(
      () => {
        this.setState(`completed`)
        const hasCalled = new Set()
        this.mutations.forEach((mutation) => {
          if (!hasCalled.has(mutation.collection.id)) {
            mutation.collection.transactions.setState((state) => state)
            mutation.collection.commitPendingTransactions()
            hasCalled.add(mutation.collection.id)
          }
        })

        this.isPersisted.resolve(this)
      }
    )

    return this
  }
}

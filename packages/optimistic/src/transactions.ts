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

export function createTransaction(config: TransactionConfig): Transaction {
  if (typeof config.mutationFn === `undefined`) {
    throw `mutationFn is required when creating a transaction`
  }

  let transactionId = config.id
  if (!transactionId) {
    transactionId = generateUUID()
  }
  return new Transaction({ ...config, id: transactionId })
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
  public metadata: Record<string, unknown>
  constructor(config: TransactionConfig) {
    this.id = config.id!
    this.mutationFn = config.mutationFn
    this.state = `pending`
    this.mutations = []
    this.isPersisted = createDeferred()
    this.autoCommit = config.autoCommit ?? true
    this.createdAt = new Date()
    this.metadata = config.metadata ?? {}
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

  applyMutations(mutations: Array<PendingMutation<any>>): void {
    for (const newMutation of mutations) {
      const existingIndex = this.mutations.findIndex(
        (m) => m.key === newMutation.key
      )

      if (existingIndex >= 0) {
        // Replace existing mutation
        this.mutations[existingIndex] = newMutation
      } else {
        // Insert new mutation
        this.mutations.push(newMutation)
      }
    }
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
    this.mutationFn({ transaction: this }).then(() => {
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
    })

    return this
  }
}

import { createTransaction } from "@tanstack/optimistic"
import type { TransactionConfig } from "@tanstack/optimistic"

export function useOptimisticMutation(config: TransactionConfig) {
  return {
    mutate: (callback: () => {}) => {
      const transaction = createTransaction(config)
      transaction.mutate(callback)
      return transaction
    },
    createTransaction: () => {
      return createTransaction({ ...config, autoCommit: false })
    },
  }
}

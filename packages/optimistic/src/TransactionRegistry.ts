import type { Transaction } from "./types"

/**
 * Global registry for managing active transactions
 * Supports nested transactions through a transaction stack
 */
export class TransactionRegistry {
  private static instance: TransactionRegistry
  private transactionStack: Array<Transaction> = []

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of TransactionRegistry
   */
  public static getInstance(): TransactionRegistry {
    return this.instance
  }

  /**
   * Register a new active transaction
   * The transaction is pushed onto the stack, supporting nested transactions
   * @param transaction - The transaction to register
   * @throws Error if the transaction is already registered
   */
  public registerActiveTransaction(transaction: Transaction): void {
    if (this.isTransactionActive(transaction.id)) {
      throw new Error(`Transaction ${transaction.id} is already active`)
    }
    this.transactionStack.push(transaction)
  }

  /**
   * Unregister an active transaction
   * Removes the transaction from the stack if it matches the given ID
   * @param transactionId - ID of the transaction to unregister
   * @throws Error if the transaction is not the most recently active one
   */
  public unregisterActiveTransaction(transactionId: string): void {
    const activeTransaction = this.getActiveTransaction()
    if (!activeTransaction) {
      throw new Error(`No active transaction to unregister`)
    }
    if (activeTransaction.id !== transactionId) {
      throw new Error(
        `Cannot unregister transaction ${transactionId} as it's not the most recently active transaction`
      )
    }
    this.transactionStack.pop()
  }

  /**
   * Get the currently active transaction
   * Returns the transaction at the top of the stack
   * @returns The active transaction or undefined if no transaction is active
   */
  public getActiveTransaction(): Transaction | undefined {
    return this.transactionStack[this.transactionStack.length - 1]
  }

  /**
   * Check if a transaction with the given ID is currently active
   * @param transactionId - ID of the transaction to check
   * @returns true if the transaction is in the stack, false otherwise
   */
  public isTransactionActive(transactionId: string): boolean {
    return this.transactionStack.some(
      (transaction) => transaction.id === transactionId
    )
  }

  /**
   * Get the current depth of nested transactions
   * @returns The number of active nested transactions
   */
  public getTransactionDepth(): number {
    return this.transactionStack.length
  }

  /**
   * Clear all active transactions
   * Should only be used for testing or error recovery
   */
  public clearTransactions(): void {
    this.transactionStack = []
  }
}

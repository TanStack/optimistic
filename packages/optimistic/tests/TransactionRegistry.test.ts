import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { TransactionRegistry } from "../src/TransactionRegistry"
import type { Transaction } from "../src/types"

describe(`TransactionRegistry`, () => {
  let registry: TransactionRegistry

  const createMockTransaction = (id: string): Transaction => ({
    id,
    state: `pending`,
    createdAt: new Date(),
    updatedAt: new Date(),
    mutations: [],
    metadata: {},
    toObject: () => ({
      id,
      state: `pending`,
      createdAt: new Date(),
      updatedAt: new Date(),
      mutations: [],
      metadata: {},
    }),
  })

  beforeEach(() => {
    registry = TransactionRegistry.getInstance()
    registry.clearTransactions()
  })

  afterEach(() => {
    registry.clearTransactions()
  })

  it(`should maintain a singleton instance`, () => {
    const instance1 = TransactionRegistry.getInstance()
    const instance2 = TransactionRegistry.getInstance()
    expect(instance1).toBe(instance2)
  })

  describe(`registerActiveTransaction`, () => {
    it(`should register a new transaction`, () => {
      const transaction = createMockTransaction(`tx1`)
      registry.registerActiveTransaction(transaction)
      expect(registry.getActiveTransaction()).toBe(transaction)
    })

    it(`should throw when registering the same transaction twice`, () => {
      const transaction = createMockTransaction(`tx1`)
      registry.registerActiveTransaction(transaction)
      expect(() => registry.registerActiveTransaction(transaction)).toThrow(
        `Transaction tx1 is already active`
      )
    })

    it(`should support nested transactions`, () => {
      const tx1 = createMockTransaction(`tx1`)
      const tx2 = createMockTransaction(`tx2`)
      const tx3 = createMockTransaction(`tx3`)

      registry.registerActiveTransaction(tx1)
      registry.registerActiveTransaction(tx2)
      registry.registerActiveTransaction(tx3)

      expect(registry.getTransactionDepth()).toBe(3)
      expect(registry.getActiveTransaction()).toBe(tx3)
    })
  })

  describe(`unregisterActiveTransaction`, () => {
    it(`should unregister the active transaction`, () => {
      const transaction = createMockTransaction(`tx1`)
      registry.registerActiveTransaction(transaction)
      registry.unregisterActiveTransaction(transaction.id)
      expect(registry.getActiveTransaction()).toBeUndefined()
    })

    it(`should throw when unregistering with no active transaction`, () => {
      expect(() => registry.unregisterActiveTransaction(`tx1`)).toThrow(
        `No active transaction to unregister`
      )
    })

    it(`should throw when unregistering a non-active transaction`, () => {
      const tx1 = createMockTransaction(`tx1`)
      const tx2 = createMockTransaction(`tx2`)
      registry.registerActiveTransaction(tx1)
      registry.registerActiveTransaction(tx2)

      expect(() => registry.unregisterActiveTransaction(`tx1`)).toThrow(
        `Cannot unregister transaction tx1 as it's not the most recently active transaction`
      )
    })

    it(`should maintain proper stack order when unregistering nested transactions`, () => {
      const tx1 = createMockTransaction(`tx1`)
      const tx2 = createMockTransaction(`tx2`)
      const tx3 = createMockTransaction(`tx3`)

      registry.registerActiveTransaction(tx1)
      registry.registerActiveTransaction(tx2)
      registry.registerActiveTransaction(tx3)

      registry.unregisterActiveTransaction(tx3.id)
      expect(registry.getActiveTransaction()).toBe(tx2)

      registry.unregisterActiveTransaction(tx2.id)
      expect(registry.getActiveTransaction()).toBe(tx1)
    })
  })
})

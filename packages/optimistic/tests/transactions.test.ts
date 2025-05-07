import { describe, expect, it } from "vitest"
import { createTransaction } from "../src/transactions"
import { Collection } from "../src/collection"

describe(`Transactions`, () => {
  it(`calling createTransaction creates a transaction`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
      metadata: { foo: true },
    })

    expect(transaction.commit).toBeTruthy()
    expect(transaction.metadata.foo).toBeTruthy()
  })
  it(`goes straight to completed if you call commit w/o any mutations`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
    })

    transaction.commit()
    expect(transaction.state).toBe(`completed`)
  })
  it(`thows an error if you don't pass in mutationFn`, () => {
    // @ts-expect-error missing argument on purpose
    expect(() => createTransaction({})).toThrowError(
      `mutationFn is required when creating a transaction`
    )
  })
  it(`thows an error if call mutate or commit or rollback when it's completed`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
    })

    transaction.commit()

    expect(() => transaction.commit()).toThrowError(
      `You can no longer call .commit() as the transaction is no longer pending`
    )
    expect(() => transaction.rollback()).toThrowError(
      `You can no longer call .rollback() as the transaction is already completed`
    )
    expect(() => transaction.mutate(() => {})).toThrowError(
      `You can no longer call .mutate() as the transaction is no longer pending`
    )
  })
  it(`should allow manually controlling the transaction lifecycle`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
      autoCommit: false,
      metadata: { foo: true },
    })
    const collection = new Collection<{ value: string; newProp?: string }>({
      id: `foo`,
      sync: {
        sync: () => {},
      },
    })

    transaction.mutate(() => {
      collection.insert({ value: `foo-me`, newProp: `something something` })
    })
    transaction.mutate(() => {
      collection.insert({ value: `foo-me2`, newProp: `something something2` })
    })

    expect(transaction.mutations).toHaveLength(2)

    transaction.commit()
  })
  it(`should allow mutating multiple collections`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
      autoCommit: false,
      metadata: { foo: true },
    })
    const collection1 = new Collection<{ value: string; newProp?: string }>({
      id: `foo`,
      sync: {
        sync: () => {},
      },
    })
    const collection2 = new Collection<{ value: string; newProp?: string }>({
      id: `foo2`,
      sync: {
        sync: () => {},
      },
    })

    transaction.mutate(() => {
      collection1.insert({ value: `foo-me`, newProp: `something something` })
      collection2.insert({ value: `foo-me`, newProp: `something something` })
    })

    expect(transaction.mutations).toHaveLength(2)

    transaction.commit()
  })
})

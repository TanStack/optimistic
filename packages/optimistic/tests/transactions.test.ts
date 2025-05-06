import { describe, expect, it, vi } from "vitest"
import { createTransaction } from "../src/transactions"

describe(`Transactions`, () => {
  it(`calling createTransaction creates a transaction`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
    })

    expect(transaction.commit).toBeTruthy()
  })
  it(`goes straight to completed if you call commit w/o any mutations`, () => {
    const transaction = createTransaction({
      mutationFn: async () => Promise.resolve(),
    })

    transaction.commit()
    expect(transaction.state).toBe(`completed`)
  })
  it(`thows an error if you don't pass in mutationFn`, () => {
    // eslint-disable-next-line deliberate
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
})

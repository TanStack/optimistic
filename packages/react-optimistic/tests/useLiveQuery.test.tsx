import { describe, expect, it } from "vitest"
import mitt from "mitt"
import { act, renderHook } from "@testing-library/react"
import { Collection } from "@tanstack/optimistic"
import { useLiveQuery } from "../src/useLiveQuery"
import type { PendingMutation } from "@tanstack/optimistic"

type Person = {
  id: string
  name: string
  age: number
  email: string
  isActive: boolean
}

type Issue = {
  id: string
  title: string
  description: string
  userId: string
}

const initialPersons: Array<Person> = [
  {
    id: `1`,
    name: `John Doe`,
    age: 30,
    email: `john.doe@example.com`,
    isActive: true,
  },
  {
    id: `2`,
    name: `Jane Doe`,
    age: 25,
    email: `jane.doe@example.com`,
    isActive: true,
  },
  {
    id: `3`,
    name: `John Smith`,
    age: 35,
    email: `john.smith@example.com`,
    isActive: true,
  },
]

const initialIssues: Array<Issue> = [
  {
    id: `1`,
    title: `Issue 1`,
    description: `Issue 1 description`,
    userId: `1`,
  },
  {
    id: `2`,
    title: `Issue 2`,
    description: `Issue 2 description`,
    userId: `2`,
  },
  {
    id: `3`,
    title: `Issue 3`,
    description: `Issue 3 description`,
    userId: `1`,
  },
]

describe(`Query Collections`, async () => {
  it(`should be able to query a collection`, async () => {
    const emitter = mitt()

    // Create collection with mutation capability
    const collection = new Collection<Person>({
      id: `optimistic-changes-test`,
      sync: {
        sync: ({ begin, write, commit }) => {
          // Listen for sync events
          // @ts-expect-error don't trust Mitt's typing and this works.
          emitter.on(`sync`, (changes: Array<PendingMutation<Person>>) => {
            begin()
            changes.forEach((change) => {
              write({
                key: change.key,
                type: change.type,
                value: change.changes,
              })
            })
            commit()
          })
        },
      },
      mutationFn: async ({ transaction }) => {
        emitter.emit(`sync`, transaction.mutations)
        return Promise.resolve()
      },
    })

    // Sync from initial state
    act(() => {
      emitter.emit(
        `sync`,
        initialPersons.map((person) => ({
          key: person.id,
          type: `insert`,
          changes: person,
        }))
      )
    })

    const { result } = renderHook(() => {
      return useLiveQuery((q) =>
        q
          .from({ collection })
          .where(`@age`, `>`, 30)
          .keyBy(`@id`)
          .select(`@id`, `@name`)
      )
    })

    expect(result.current.size).toBe(1)
    expect(result.current.get(`3`)).toEqual({
      id: `3`,
      name: `John Smith`,
    })

    // Insert a new person
    act(() => {
      emitter.emit(`sync`, [
        {
          key: `4`,
          type: `insert`,
          changes: {
            id: `4`,
            name: `Kyle Doe`,
            age: 40,
            email: `kyle.doe@example.com`,
            isActive: true,
          },
        },
      ])
    })

    await waitForChanges()

    expect(result.current.size).toBe(2)
    expect(result.current.get(`3`)).toEqual({
      id: `3`,
      name: `John Smith`,
    })
    expect(result.current.get(`4`)).toEqual({
      id: `4`,
      name: `Kyle Doe`,
    })

    // Update the person
    act(() => {
      emitter.emit(`sync`, [
        {
          key: `4`,
          type: `update`,
          changes: {
            name: `Kyle Doe 2`,
          },
        },
      ])
    })

    await waitForChanges()

    expect(result.current.size).toBe(2)
    expect(result.current.get(`4`)).toEqual({
      id: `4`,
      name: `Kyle Doe 2`,
    })

    // Delete the person
    act(() => {
      emitter.emit(`sync`, [
        {
          key: `4`,
          type: `delete`,
        },
      ])
    })

    await waitForChanges()

    expect(result.current.size).toBe(1)
    expect(result.current.get(`4`)).toBeUndefined()
  })

  it(`should join collections and return combined results`, async () => {
    const emitter = mitt()

    // Create person collection
    const personCollection = new Collection<Person>({
      id: `person-collection-test`,
      sync: {
        sync: ({ begin, write, commit }) => {
          // @ts-expect-error Mitt typing doesn't match our usage
          emitter.on(
            `sync-person`,
            // @ts-expect-error Mitt typing doesn't match our usage
            (changes: Array<PendingMutation<Person>>) => {
              begin()
              changes.forEach((change) => {
                write({
                  key: change.key,
                  type: change.type,
                  value: change.changes,
                })
              })
              commit()
            }
          )
        },
      },
      mutationFn: async ({ transaction }) => {
        emitter.emit(`sync-person`, transaction.mutations)
        return Promise.resolve()
      },
    })

    // Create issue collection
    const issueCollection = new Collection<Issue>({
      id: `issue-collection-test`,
      sync: {
        sync: ({ begin, write, commit }) => {
          // @ts-expect-error Mitt typing doesn't match our usage
          emitter.on(`sync-issue`, (changes: Array<PendingMutation<Issue>>) => {
            begin()
            changes.forEach((change) => {
              write({
                key: change.key,
                type: change.type,
                value: change.changes,
              })
            })
            commit()
          })
        },
      },
      mutationFn: async ({ transaction }) => {
        emitter.emit(`sync-issue`, transaction.mutations)
        return Promise.resolve()
      },
    })

    // Sync initial person data
    act(() => {
      emitter.emit(
        `sync-person`,
        initialPersons.map((person) => ({
          key: person.id,
          type: `insert`,
          changes: person,
        }))
      )
    })

    // Sync initial issue data
    act(() => {
      emitter.emit(
        `sync-issue`,
        initialIssues.map((issue) => ({
          key: issue.id,
          type: `insert`,
          changes: issue,
        }))
      )
    })

    const { result } = renderHook(() => {
      return useLiveQuery((q) =>
        q
          .from({ issues: issueCollection })
          .join({
            type: `inner`,
            from: { persons: personCollection },
            on: [`@persons.id`, `=`, `@issues.userId`],
          })
          .select(`@issues.id`, `@issues.title`, `@persons.name`)
          .keyBy(`@id`)
      )
    })

    await waitForChanges()

    // Verify that we have the expected joined results
    expect(result.current.size).toBe(3)

    expect(result.current.get(`1`)).toEqual({
      id: `1`,
      name: `John Doe`,
      title: `Issue 1`,
    })

    expect(result.current.get(`2`)).toEqual({
      id: `2`,
      name: `Jane Doe`,
      title: `Issue 2`,
    })

    expect(result.current.get(`3`)).toEqual({
      id: `3`,
      name: `John Doe`,
      title: `Issue 3`,
    })

    // Add a new issue for user 1
    act(() => {
      emitter.emit(`sync-issue`, [
        {
          key: `4`,
          type: `insert`,
          changes: {
            id: `4`,
            title: `Issue 4`,
            description: `Issue 4 description`,
            userId: `2`,
          },
        },
      ])
    })

    await waitForChanges()

    expect(result.current.size).toBe(4)
    expect(result.current.get(`4`)).toEqual({
      id: `4`,
      name: `Jane Doe`,
      title: `Issue 4`,
    })

    // Update an issue we're already joined with
    act(() => {
      emitter.emit(`sync-issue`, [
        {
          key: `2`,
          type: `update`,
          changes: {
            title: `Updated Issue 2`,
          },
        },
      ])
    })

    await waitForChanges()

    // The updated title should be reflected in the joined results
    expect(result.current.get(`2`)).toEqual({
      id: `2`,
      name: `Jane Doe`,
      title: `Updated Issue 2`,
    })

    // Delete an issue
    act(() => {
      emitter.emit(`sync-issue`, [
        {
          key: `3`,
          type: `delete`,
        },
      ])
    })

    await waitForChanges()

    // After deletion, user 3 should no longer have a joined result
    expect(result.current.get(`3`)).toBeUndefined()
  })
})

async function waitForChanges(ms = 100) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

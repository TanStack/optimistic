import { describe, expect, it, vi } from "vitest"
import mitt from "mitt"
import { Collection } from "../../src/collection.js"
import { queryBuilder } from "../../src/query/query-builder.js"
import { compileQuery } from "../../src/query/compiled-query.js"

type Person = {
  id: string
  name: string
  age: number
  email: string
  isActive: boolean
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

describe(`Query Collections`, async () => {
  it(`should be able to query a collection`, async () => {
    const emitter = mitt()
    const callback = vi.fn()

    // Create collection with mutation capability
    const collection = new Collection<Person>({
      id: `optimistic-changes-test`,
      sync: {
        sync: ({ begin, write, commit }) => {
          // Listen for sync events
          // @ts-expect-error don't trust Mitt's typing and this works.
          emitter.on(`sync`, (changes: Array<PendingMutation>) => {
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
    emitter.emit(
      `sync`,
      initialPersons.map((person) => ({
        key: person.id,
        type: `insert`,
        changes: person,
      }))
    )

    const query = queryBuilder()
      .from({ collection })
      .where(`@age`, `>`, 30)
      .keyBy(`@id`)
      .select(`@id`, `@name`)

    const compiledQuery = compileQuery(query)

    compiledQuery.start()

    const result = compiledQuery.results

    expect(result.state.size).toBe(1)
    expect(result.state.get(`3`)).toEqual({
      id: `3`,
      name: `John Smith`,
    })

    // Insert a new person
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

    await waitForChanges()

    expect(result.state.size).toBe(2)
    expect(result.state.get(`3`)).toEqual({
      id: `3`,
      name: `John Smith`,
    })
    expect(result.state.get(`4`)).toEqual({
      id: `4`,
      name: `Kyle Doe`,
    })

    // Update the person
    emitter.emit(`sync`, [
      {
        key: `4`,
        type: `update`,
        changes: {
          name: `Kyle Doe 2`,
        },
      },
    ])

    await waitForChanges()

    expect(result.state.size).toBe(2)
    expect(result.state.get(`4`)).toEqual({
      id: `4`,
      name: `Kyle Doe 2`,
    })

    // Delete the person
    emitter.emit(`sync`, [
      {
        key: `4`,
        type: `delete`,
      },
    ])

    await waitForChanges()

    expect(result.state.size).toBe(1)
    expect(result.state.get(`4`)).toBeUndefined()
  })
})

async function waitForChanges(ms = 100) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

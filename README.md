
# TanStack DB

<!-- ![TanStack DB Header](https://github.com/tanstack/db/raw/main/media/repo-header.png) -->

**A reactive client store for building super fast apps on sync**

TanStack DB extends TanStack Query with collections, live queries and transactional mutations that keep your UI reactive, consistent and blazing fast 🔥

<p>
  <a href="https://x.com/intent/post?text=TanStack%20DB&url=https://tanstack.com/db">
    <img alt="#TanStack" src="https://img.shields.io/twitter/url?color=%2308a0e9&label=%23TanStack&style=social&url=https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Fbutton_hashtag%3DTanStack">
  </a><a href="https://discord.gg/yjUNbvbraC">
    <img alt="" src="https://img.shields.io/badge/Discord-TanStack-%235865F2" />
  </a><a href="https://discord.electric-sql.com">
    <img alt="" src="https://img.shields.io/badge/Discord-Electric-%235865F2" />
  </a><a href="https://npmjs.com/package/@tanstack/db">
    <img alt="" src="https://img.shields.io/npm/dm/@tanstack/db.svg" />
  </a><a href="https://github.com/tanstack/db/discussions">
    <img alt="Join the discussion on Github" src="https://img.shields.io/badge/Discussions-Chat%20now!-green" />
  </a><a href="https://x.com/tan_stack">
    <img alt="" src="https://img.shields.io/twitter/follow/tan_stack.svg?style=social&label=Follow @TanStack" />
  </a>
</p>

Enjoy this library? Try the entire [TanStack](https://tanstack.com), including [TanStack Query](https://tanstack.com/query), [TanStack Store](https://tanstack.com/store), etc.

## 🚀 Why TanStack DB?

TanStack DB gives you robust support for real-time sync, live queries and local writes. With no stale data, super fast re-rendering and sub-millisecond cross-collection queries — even for large complex apps.

Built on a [TypeScript implementation of differential dataflow](https://github.com/electric-sql/d2ts), TanStack DB provides:

- 🔥 **a blazing fast query engine**<br />
  for sub-millisecond live queries &mdash; even for complex queries with joins and aggregates
- 🎯 **fine-grained reactivity**<br />
  to minimize component re-rendering
- 💪 **robust transaction primitives**<br />
  for easy optimistic mutations with sync and lifecycle support
- 🌟 **normalized data**<br />
  to keep your backend simple

TanStack DB is **backend agnostic** and **incrementally adoptable**:

- plug in any backend: sync engines, polling APIs, GraphQL, custom sources
- builds on [TanStack Store](https://tanstack.com/store), works with and alongside [TanStack Query](https://tanstack.com/query)

## 💥 Usage example

Sync data into collections. Bind live queries to your components. Make writes using transactional mutations.

```tsx
import { Collection, createTransaction, useLiveQuery } from '@tanstack/react-optimistic'
import type { MutationFn, PendingMutation } from '@tanstack/react-optimistic'

// Sync data into collections.
// You can use a sync engine or any data loading strategy.
export const todoCollection = new Collection<Todo>({
  id: 'todos',
  sync: {
    // config
  },
  schema: todoSchema // standard schema interface
})

// Bind live queries to your components.
// You can query across collections with support for joins, aggregates, etc.
const Todos = () => {
  const { data: todos } = useLiveQuery(q =>
    q
      .from({ todoCollection })
      .select('@t.id', '@t.text', '@t.completed')
      .keyBy('@id')
  )

  return <List items={todos} />
}

// Make writes using transactional mutations.
// With optimistic state and background sync managed for you.
const tx = createTransaction({ mutationFn: /* ... */ })
tx.mutate(() =>
  todoCollection.insert({
    id: uuid(),
    text: '🔥 Make app faster',
    completed: false
  })
)
```

## 🧱 Core concepts

### Collections

- typed sets of objects that can mirror a backend table
- or be populated with a filtered view or result set, such as `pendingTodos` or `decemberNewTodos`
- collections are just JavaScript data &mdash; load them on demand and define as many as you need

### Live Queries

- run reactively against and across collections
- with support for joins, filters and aggregates
- powered by differential dataflow: query results update incrementally, not by re-running the whole query

### Transactions

- batch and stage local changes across collections
- immediate application of local optimistic updates
- sync to the backend using flexible mutationFns
- with automatic rollbacks and management of optimistic state

## 🔧 Install

```bash
npm install @tanstack/db
```

## 📚 Docs

See the [Documentation](./docs/index.md) for more API reference and usage guides.

## ❓ FAQ

**How is this different from TanStack Query?**<br />
TanStack DB builds *on top of* TanStack Query. Use Query to fetch data; use DB to manage reactive local collections and mutations. They complement each other.

**Do I need a sync engine like ElectricSQL?**<br />
No. TanStack DB works with any backend: polling APIs, GraphQL, REST, or custom sync logic.

**What is a Collection? Is it like a DB table?**<br />
Kind of. Collections are typed sets of objects, but they can also be filtered views or custom groupings. They're just JavaScript structures that you define and manage.

**Is this an ORM? Do queries hit my backend?**<br />
No. TanStack DB is not an ORM. Queries run entirely in the client against local collections. The framework provides strong primitives to manage how data is loaded and synced.

## Partners

<a href="https://electric-sql.com">
  <img alt="ElectricSQL logo"
      src="https://raw.githubusercontent.com/electric-sql/meta/main/identity/ElectricSQL-logo.with-background.sm.png"
  />
</a>

## Contributing

View the contributing guidelines [here](https://github.com/TanStack/query/blob/main/CONTRIBUTING.md).

### [Become a Sponsor!](https://github.com/sponsors/tannerlinsley/)

<!-- Use the force, Luke -->

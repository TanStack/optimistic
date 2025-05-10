
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

## ❓ FAQ

**How is this different from TanStack Query?**<br />
TanStack DB builds *on top of* TanStack Query. Use Query to fetch data; use DB to manage reactive local collections and mutations. They complement each other.

**Do I need a sync engine like ElectricSQL?**<br />
No. TanStack DB works with any backend: polling APIs, GraphQL, REST, or custom sync logic.

**What is a Collection? Is it like a DB table?**<br />
Kind of. Collections are typed sets of objects, but they can also be filtered views or custom groupings. They're just JavaScript structures that you define and manage.

**Is this an ORM? Do queries hit my backend?**<br />
No. TanStack DB is not an ORM. Queries run entirely in the client against local collections. The framework provides strong primitives to manage how data is loaded and synced.

## 🔧 Installation

```bash
npm install @tanstack/db
```

## 📚 API Reference

### React Hooks

#### `useCollection`

The primary hook for interacting with collections in React components.

```typescript
// Create a collection
const { data, insert, update, delete: deleteFn } = useCollection({
  id: 'todos',
  sync: { /* sync configuration */ },
  schema: /* optional schema */
});

// Create a mutation
const mutation = useOptimisticMutation({
  mutationFn: async ({ mutations }) => {
    // Implement your mutation logic here
    // This function is called when mutations are committed
  }
});

// Use the mutation with collection operations
mutation.mutate(() => {
  insert({ text: 'New todo' });
});
```

Returns:

- `data`: An array of all items in the collection
- `state`: A Map containing all items in the collection with their internal keys
- `insert`: Function to add new items to the collection
- `update`: Function to modify existing items
- `delete`: Function to remove items from the collection

#### `preloadCollection`

Preloads data for a collection before rendering components.

```typescript
await preloadCollection({
  id: 'todos',
  sync: { /* sync configuration */ },
  mutationFn: { /* mutation functions */ },
  schema: /* optional schema */
});
```

Features:

1. Returns a promise that resolves when the first sync commit is complete
2. Shares the same collection instance with `useCollection`
3. Handles already-loaded collections by returning immediately
4. Avoids duplicate initialization when called multiple times with the same ID

### Data Operations

#### Insert

```typescript
// Insert a single item
insert({ text: "Buy groceries", completed: false })

// Insert multiple items
insert([
  { text: "Buy groceries", completed: false },
  { text: "Walk dog", completed: false },
])

// Insert with custom key
insert({ text: "Buy groceries" }, { key: "grocery-task" })
```

#### Update

We use a proxy to capture updates as immutable draft optimistic updates.

```typescript
// Update a single item
update(todo, (draft) => {
  draft.completed = true
})

// Update multiple items
update([todo1, todo2], (drafts) => {
  drafts.forEach((draft) => {
    draft.completed = true
  })
})

// Update with metadata
update(todo, { metadata: { reason: "user update" } }, (draft) => {
  draft.text = "Updated text"
})
```

#### Delete

```typescript
// Delete a single item
delete todo

// Delete multiple items
delete [todo1, todo2]

// Delete with metadata
delete (todo, { metadata: { reason: "completed" } })
```

### Schema Validation

Collections can optionally include a [standard schema](https://github.com/standard-schema/standard-schema) for data validation:

```typescript
const todoCollection = useCollection({
  id: "todos",
  sync: {
    /* sync config */
  },
  mutationFn: {
    /* mutation functions */
  },
  schema: todoSchema, // Standard schema interface
})
```

## Transaction Management

The library includes a simple yet powerful transaction management system. Transactions are created using the `createTransaction` function:

```typescript
const tx = createTransaction({
  mutationFn: async ({ transaction }) => {
    // Implement your mutation logic here
    // This function is called when the transaction is committed
  },
})

// Apply mutations within the transaction
tx.mutate(() => {
  // All collection operations (insert/update/delete) within this callback
  // will be part of this transaction
})
```

Transactions progress through several states:

1. `pending`: Initial state when a transaction is created
2. `persisting`: Transaction is being persisted to the backend
3. `completed`: Transaction has been successfully persisted
4. `failed`: An error was thrown while persisting or syncing back the Transaction

## Implementing Backend Integration with ElectricSQL

The `mutationFn` property is where you define how your application interacts with your backend. Here's a comprehensive example of integrating with ElectricSQL:

```typescript
import { useCollection } from "@TanStack/optimistic/useCollection"
import { createElectricSync } from '@TanStack/optimistic/electric';

// Create a collection configuration for todos
const todosConfig = {
  id: 'todos',
  // Create an ElectricSQL sync configuration
  sync: createElectricSync(
    {
      // ShapeStream options
      url: `http://localhost:3000/v1/shape`,
      params: {
        table: 'todos',
      },
    },
    {
      // Primary key for the todos table
      primaryKey: ['id'],
    }
  ),
};

// In your component
function TodoList() {
  const { data, insert, update, delete: deleteFn } = useCollection(todosConfig)

  // Create a mutation for handling all todo operations
  const todoMutation = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      // Filter out collection from mutations before sending to server
      const payload = transaction.mutations.map(m => {
        const { collection, ...payload } = m
        return payload
      })

      const response = await fetch(`http://localhost:3001/api/mutations`, {
        method: `POST`,
        headers: {
          "Content-Type": `application/json`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        // Throwing an error will rollback the optimistic state.
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const result = await response.json()

      try {
        // Use the awaitTxid function from the ElectricSync configuration
        // This waits for the specific transaction to be synced to the server
        await transaction.mutations[0].collection.config.sync.awaitTxid(result.txid)
      } catch (error) {
        console.error('Error waiting for transaction to sync:', error);
        // Throwing an error will rollback the optimistic state.
        throw error;
      }
    },
  })

  // Use the mutation for any todo operations
  const addTodo = () => {
    todoMutation.mutate(() => {
      insert({ title: 'New todo', completed: false })
    })
  }

  // ... rest of your component
}

// In a route loader
export async function loader() {
  // Preload todos before rendering
  await preloadCollection(todosConfig);
  return null;
}

// Example usage in a component
function TodoList() {
  const { data, insert, update, delete: remove } = useCollection(todosConfig);

  const addTodo = () => {
    insert({ title: 'New todo', completed: false });
  };

  const toggleTodo = (todo) => {
    update(todo, (draft) => {
      draft.completed = !draft.completed;
    });
  };

  const removeTodo = (todo) => {
    remove(todo);
  };

  return (
    <div>
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {data.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
            />
            {todo.title}
            <button onClick={() => removeTodo(todo)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

This implementation:

1. **Creates an ElectricSQL sync configuration** using the `createElectricSync` helper
2. **Handles mutations** by POSTing them to a backend API.
3. **Uses transactions** to ensure data consistency
4. **Tracks sync status** with the `awaitTxid` function
5. **Provides proper error handling** throughout the process

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

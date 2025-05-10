
# TanStack DB - Docs

> [!WARNING]
> This file contains temporary usage docs (extracted and extended from the initial project README)
>
> It is intended to be superceeded by published project documentation.

## API and usage docs

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

### Transaction Management

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

### Implementing Backend Integration with ElectricSQL

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

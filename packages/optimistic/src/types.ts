import type { Collection } from "./collection"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { Transaction } from "./transactions"

export type TransactionState = `pending` | `persisting` | `completed` | `failed`

/**
 * Represents a pending mutation within a transaction
 * Contains information about the original and modified data, as well as metadata
 */
export interface PendingMutation<T extends object = Record<string, unknown>> {
  mutationId: string
  original: Record<string, unknown>
  modified: Record<string, unknown>
  changes: Record<string, unknown>
  key: string
  type: OperationType
  metadata: unknown
  syncMetadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  collection: Collection<T>
}

/**
 * Configuration options for creating a new transaction
 */
export type MutationFnParams = {
  transaction: Transaction
}

export type MutationFn = (params: MutationFnParams) => Promise<any>

export interface TransactionConfig {
  /** Unique identifier for the transaction */
  id?: string
  /* If the transaction should autocommit after a mutate call or should commit be called explicitly */
  autoCommit?: boolean
  mutationFn: MutationFn
  /** Custom metadata to associate with the transaction */
  metadata?: Record<string, unknown>
}

export type { Transaction }

type Value<TExtensions = never> =
  | string
  | number
  | boolean
  | bigint
  | null
  | TExtensions
  | Array<Value<TExtensions>>
  | { [key: string]: Value<TExtensions> }

export type Row<TExtensions = never> = Record<string, Value<TExtensions>>

export type OperationType = `insert` | `update` | `delete`

export interface SyncConfig<T extends object = Record<string, unknown>> {
  sync: (params: {
    collection: Collection<T>
    begin: () => void
    write: (message: ChangeMessage<T>) => void
    commit: () => void
  }) => void

  /**
   * Get the sync metadata for insert operations
   * @returns Record containing primaryKey and relation information
   */
  getSyncMetadata?: () => Record<string, unknown>
}

export interface ChangeMessage<T extends object = Record<string, unknown>> {
  key: string
  value: T
  previousValue?: T
  type: OperationType
  metadata?: Record<string, unknown>
}

export interface OptimisticChangeMessage<
  T extends object = Record<string, unknown>,
> extends ChangeMessage<T> {
  // Is this change message part of an active transaction. Only applies to optimistic changes.
  isActive?: boolean
}

/**
 * The Standard Schema interface.
 * This follows the standard-schema specification: https://github.com/standard-schema/standard-schema
 */
export type StandardSchema<T> = StandardSchemaV1 & {
  "~standard": {
    types?: {
      input: T
      output: T
    }
  }
}

/**
 * Type alias for StandardSchema
 */
export type StandardSchemaAlias<T = unknown> = StandardSchema<T>

export interface OperationConfig {
  metadata?: Record<string, unknown>
}

export interface InsertConfig {
  key?: string | Array<string | undefined>
  metadata?: Record<string, unknown>
}

export interface CollectionConfig<T extends object = Record<string, unknown>> {
  id: string
  sync: SyncConfig<T>
  schema?: StandardSchema<T>
}

export type ChangesPayload<T extends object = Record<string, unknown>> = Array<
  ChangeMessage<T>
>

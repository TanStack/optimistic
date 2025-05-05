import { useEffect, useMemo } from "react"
import { useStore } from "@tanstack/react-store"
import { queryBuilder, compileQuery } from "@tanstack/optimistic"
import type {
  InitialQueryBuilder,
  QueryBuilder,
  Context,
  Schema,
  ResultFromQueryBuilder,
} from "@tanstack/optimistic"

export function useLiveQuery<
  TResultQueryBuilder extends QueryBuilder<Context<Schema>>,
>(
  queryFn: (q: InitialQueryBuilder<Context<Schema>>) => TResultQueryBuilder,
  deps: Array<unknown> = []
): ResultFromQueryBuilder<TResultQueryBuilder> {
  const compiledQuery = useMemo(() => {
    const query = queryFn(queryBuilder())
    const compiled = compileQuery(query)
    compiled.start()
    return compiled
  }, deps)

  useEffect(() => {
    return () => {
      compiledQuery.stop()
    }
  }, [compiledQuery])

  return useStore(compiledQuery.results.derivedState)
}

import { Collection } from "@tanstack/optimistic"

const collection = new Collection<{
  id: string
  something: string
  age: number
}>()

useLiveQuery((q) => q
  .from({ collection })
  .select("@id", "@something", "@age")
, [])
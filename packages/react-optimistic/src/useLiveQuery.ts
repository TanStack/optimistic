import { useEffect, useMemo } from "react"
import { useStore } from "@tanstack/react-store"
import { compileQuery, queryBuilder } from "@tanstack/optimistic"
import type {
  Context,
  InitialQueryBuilder,
  QueryBuilder,
  ResultsFromContext,
  Schema,
} from "@tanstack/optimistic"

export function useLiveQuery<
  TResultContext extends Context<Schema> = Context<Schema>,
>(
  queryFn: (
    q: InitialQueryBuilder<Context<Schema>>
  ) => QueryBuilder<TResultContext>,
  deps: Array<unknown> = []
): Map<string, ResultsFromContext<TResultContext>> {
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

import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Run } from '@/types'

/**
 * Options for {@link useRunsForOrganizationQuery}.
 *
 * The shape is a discriminated union: callers pick *either* the preset mode
 * (a named `timeframe` of 'upcoming' or 'past') *or* the custom mode (an
 * explicit `from`/`to` window). Mixing keys from both branches is a type
 * error, so the call site stays unambiguous.
 *
 * - `preset` is the everyday case used by the org view and dashboard.
 *   - 'upcoming' fetches runs from now forward, sorted ascending.
 *   - 'past' fetches runs before now, sorted descending; an optional `limit`
 *     caps how many are returned (used for "recent runs" feeds).
 * - `custom` is for analytics/admin views that need a specific window such as
 *   "the last 365 days" — date math lives at the call site.
 */
export type RunsForOrganizationQueryOptions =
  | { timeframe: 'upcoming'; limit?: number }
  | { timeframe: 'past'; limit?: number }
  | { from?: Date; to?: Date; direction?: 'asc' | 'desc'; limit?: number }

/**
 * Type guard distinguishing preset mode from custom mode.
 *
 * The preset branch always carries a `timeframe` literal; the custom branch
 * never does. Checking for that property keeps the rest of the hook type-safe
 * without resorting to casts.
 */
function isPresetMode(
  options: RunsForOrganizationQueryOptions,
): options is { timeframe: 'upcoming' | 'past'; limit?: number } {
  return 'timeframe' in options
}

/**
 * Fetch runs for a specific organization, either by named timeframe
 * (`'upcoming'` / `'past'`) or by an explicit date window.
 *
 * The view is responsible for choosing a mode; this hook does no client-side
 * filtering beyond what the repository already does. The org view and
 * dashboard both call the preset variant so they share cache entries — when
 * a mutation invalidates `runs.forOrganizationInTimeframe(orgId, ...)`,
 * both views update.
 *
 * Cache key stability: the key includes the resolved options. We normalize
 * `Date` values to ISO strings inside a `computed` so that two semantically
 * equal windows yield the same key reference (`Date` objects compare by
 * identity, which would otherwise cause spurious refetches).
 */
export function useRunsForOrganizationQuery(
  organizationId: MaybeRefOrGetter<string | undefined>,
  options: MaybeRefOrGetter<RunsForOrganizationQueryOptions>,
) {
  const runRepository = useRunRepository()
  const normalizedOrganizationId = computed(() => toValue(organizationId))

  // Resolve the options once per change. We capture two parallel views of the
  // same configuration:
  //   - `repositoryArgs`: the direction/limit handed to the repo (no timestamp
  //     for preset mode — the queryFn computes `now` at execution time so each
  //     refetch uses the current clock rather than the stale mount-time value)
  //   - `keyParams`:      stable form used in the TanStack Query cache key
  // Splitting them keeps the repo call ergonomic while the cache key stays
  // referentially stable across renders.
  const resolved = computed(() => {
    const value = toValue(options)

    if (isPresetMode(value)) {
      // Preset mode: `now` is intentionally omitted here. The queryFn (below)
      // calls `new Date()` each time it runs so that background refetches
      // always query from/to the actual current time rather than the frozen
      // timestamp from when the component first mounted.
      if (value.timeframe === 'upcoming') {
        return {
          repositoryArgs: { direction: 'asc' as const, limit: value.limit },
          keyParams: {
            mode: 'preset' as const,
            timeframe: 'upcoming' as const,
            limit: value.limit,
          },
        }
      }

      // 'past' — runs strictly before now, newest first.
      return {
        repositoryArgs: { direction: 'desc' as const, limit: value.limit },
        keyParams: {
          mode: 'preset' as const,
          timeframe: 'past' as const,
          limit: value.limit,
        },
      }
    }

    // Custom mode: pass through the explicit window. Default direction is
    // ascending to match `getRunsForOrganization`'s historical behavior.
    const direction = value.direction ?? 'asc'
    return {
      repositoryArgs: {
        from: value.from,
        to: value.to,
        direction,
        limit: value.limit,
      },
      keyParams: {
        mode: 'custom' as const,
        from: value.from?.toISOString(),
        to: value.to?.toISOString(),
        direction,
        limit: value.limit,
      },
    }
  })

  const queryKey = computed(() =>
    queryKeys.runs.forOrganizationInTimeframe(
      normalizedOrganizationId.value ?? 'unknown',
      resolved.value.keyParams,
    ),
  )

  return useQuery<Run[]>({
    queryKey,
    enabled: computed(() => !!normalizedOrganizationId.value),
    queryFn: () => {
      const args = resolved.value.repositoryArgs
      const keyP = resolved.value.keyParams

      // For preset mode, build the time boundary fresh on every execution so
      // that background refetches always use the current clock — not the
      // timestamp captured when the component first rendered.
      const now = new Date()
      const timeArgs =
        keyP.mode === 'preset' && keyP.timeframe === 'upcoming'
          ? { ...args, from: now }
          : keyP.mode === 'preset' && keyP.timeframe === 'past'
            ? { ...args, to: now }
            : args

      return runRepository.getRunsForOrganizationInTimeframe(
        normalizedOrganizationId.value!,
        timeArgs,
      )
    },
  })
}

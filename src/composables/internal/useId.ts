let nextIdentifier = 0

/**
 * Returns a stable unique ID for the current component instance.
 * The counter is module-scoped so every call gets a distinct value.
 *
 * This app is a client-rendered Vite SPA, so a simple in-memory counter
 * is sufficient and avoids unstable IDs derived from props or Math.random().
 */
export function useId(prefix = 'id'): string {
  nextIdentifier += 1
  return `${prefix}-${nextIdentifier}`
}

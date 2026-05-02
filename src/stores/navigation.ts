import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * Tracks navigation history so the back button in AppHeader can:
 *   1. Know which route was visited before the current one (for RunView/UserSettings)
 *   2. Display a descriptive label (e.g. "Boston Achilles") that screen readers
 *      announce as "Back to Boston Achilles".
 *
 * Only views that show a back button are responsible for calling setBackLabel.
 * The router guard populates previousRoute on every navigation.
 */
export const useNavigationStore = defineStore('navigation', () => {
  // The route the user was on before the current one.
  // Stored as a plain object (name + params) so we don't hold a live reference.
  const previousRoute = ref<{ name: string; params: Record<string, string> } | null>(null)

  // Human-readable label for the back-button destination, e.g. "Boston Achilles" or "March 15 Run".
  // Each view sets this once its data has loaded.
  const backLabel = ref<string | null>(null)

  // Routes that act as intermediate editors: navigating *away* from them should
  // not overwrite previousRoute. This keeps the back button on RunView pointing
  // at the organization page even after a round-trip through EditRunView.
  const TRANSPARENT_ROUTES = new Set(['EditRun', 'CreateRun'])

  /**
   * Called by the router beforeEach guard before every navigation.
   * Captures where the user is coming from so views with dynamic back targets
   * (RunView, UserSettingsView) can read previousRoute.name to decide where to go.
   *
   * Transparent routes (e.g. EditRun) are skipped so that returning from an
   * editor doesn't clobber the original back destination.
   */
  function recordNavigation(from: RouteLocationNormalizedLoaded): void {
    if (from.name && !TRANSPARENT_ROUTES.has(String(from.name))) {
      previousRoute.value = {
        name: String(from.name),
        params: from.params as Record<string, string>,
      }
    }
  }

  /**
   * Called by each view (in a watch on its loaded data) to provide a
   * human-readable destination label for the back button aria-label.
   * Pass null to hide the back button (e.g. on Dashboard where there's nowhere to go back to).
   */
  function setBackLabel(label: string | null): void {
    backLabel.value = label
  }

  return { previousRoute, backLabel, recordNavigation, setBackLabel }
})

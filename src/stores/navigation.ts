import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Tracks back-button state for AppHeader.
 *
 * Each view controls the back button by calling setBackLabel and setBackDestination.
 * Views that don't want a back button (e.g. Dashboard) call setBackLabel(null).
 * AppHeader shows the button when both label and destination are set.
 */
export const useNavigationStore = defineStore('navigation', () => {
  // Human-readable label for the back button aria-label, e.g. "Boston Achilles".
  // Null hides the button (e.g. on Dashboard).
  const backLabel = ref<string | null>(null)

  // Route to push when the back button is clicked. Views with a fixed parent set
  // this explicitly; views like UserSettingsView leave it null and rely on router.back().
  const backDestination = ref<{ name: string; params: Record<string, string> } | null>(null)

  function setBackLabel(label: string | null): void {
    backLabel.value = label
  }

  function setBackDestination(name: string, params: Record<string, string>): void {
    backDestination.value = { name, params }
  }

  return { backLabel, backDestination, setBackLabel, setBackDestination }
})

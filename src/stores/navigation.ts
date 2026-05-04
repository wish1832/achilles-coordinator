import { defineStore } from 'pinia'
import { ref } from 'vue'

// Holds the human-readable label for the back button. Views set this once their
// data has resolved; AppHeader reads it as a plain string with no fetching of its own.
export const useNavigationStore = defineStore('navigation', () => {
  // The label displayed next to the back chevron, e.g. "Central Park" or "Achilles NYC".
  // null means no label is available yet (or the current route has no back button).
  const backLabel = ref<string | null>(null)

  // Called by each view after its primary data resolves. Views that back to
  // "Dashboard" pass the static string 'home'; views that back to a named entity
  // pass that entity's name.
  function setBackLabel(label: string | null): void {
    backLabel.value = label
  }

  return { backLabel, setBackLabel }
})

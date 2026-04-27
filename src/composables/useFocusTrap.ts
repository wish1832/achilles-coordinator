/**
 * useFocusTrap — shared focus-trap logic for components.
 *
 * Handles:
 *   - Tab / Shift+Tab cycling within a container element
 *   - Saving and restoring focus around open/close
 *   - Body scroll lock
 *   - Optional `inert` attribute on the app root (useful for drawers where
 *     the background DOM remains mounted)
 *   - Cleanup on unmount
 *
 * Usage:
 *   const { activateTrap, deactivateTrap } = useFocusTrap(containerRef, {
 *     initialFocusRef,   // element to focus on open (defaults to containerRef)
 *     manageInert,       // set true to toggle inert on #app (default: false)
 *   })
 *
 *   // In your isOpen watcher:
 *   watch(() => props.isOpen, (open) => open ? activateTrap() : deactivateTrap())
 */

import { onUnmounted, type Ref } from 'vue'

// CSS selector that matches all standard keyboard-focusable elements.
// Disabled controls are intentionally excluded so the trap never lands on them.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface FocusTrapOptions {
  /**
   * Element that should receive focus when the trap activates.
   * Defaults to the container itself.
   */
  initialFocusRef?: Ref<HTMLElement | null | undefined>

  /**
   * When true, the `inert` attribute is toggled on `#app` while the trap is
   * active so background content is fully hidden from keyboard and AT users.
   * Use this for drawers where the page DOM remains in the tree.
   */
  manageInert?: boolean
}

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: FocusTrapOptions = {},
) {
  const { initialFocusRef, manageInert = false } = options

  /** The element that held focus before the trap activated; restored on deactivate. */
  let previouslyFocusedElement: HTMLElement | null = null

  /** Teardown function registered by the active Tab listener. */
  let cleanupTabListener: (() => void) | null = null

  // ── Tab cycling ────────────────────────────────────────────────────────────

  /**
   * Installs a keydown listener on the container that cycles Tab focus within
   * the set of focusable children.
   *
   * The focusable list is re-queried on every Tab press so the trap stays
   * correct even when list items are added or removed while the trap is active
   * (e.g. search results filtering in the drawer).
   */
  function installTabListener(): () => void {
    const container = containerRef.value
    if (!container) return () => {}

    // Capture a stable reference so the closure always has a non-null element.
    const el = container

    function handleTabKey(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return

      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return

      const first: HTMLElement = focusable[0]!
      const last: HTMLElement = focusable[focusable.length - 1]!

      if (event.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    el.addEventListener('keydown', handleTabKey)
    return () => el.removeEventListener('keydown', handleTabKey)
  }

  // ── Inert helper ───────────────────────────────────────────────────────────

  function setAppInert(inert: boolean): void {
    const appRoot = document.getElementById('app')
    if (!appRoot) return
    if (inert) {
      appRoot.setAttribute('inert', '')
    } else {
      appRoot.removeAttribute('inert')
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Saves the currently focused element so it can be restored on deactivate.
   *
   * Call this *before* `await nextTick()` in your `isOpen` watcher — after the
   * tick, browsers may have moved focus to `<body>` (e.g. when a click on an
   * anchor with `.prevent` loses focus). `activateTrap` will use this saved
   * value if present, otherwise falls back to `document.activeElement`.
   */
  function saveFocus(): void {
    previouslyFocusedElement = document.activeElement as HTMLElement
  }

  /**
   * Activates the trap.
   *
   * Call this after `await nextTick()` inside your `isOpen` watcher so the
   * container element is present in the DOM. Call `saveFocus()` before the
   * `await` to guarantee the correct element is restored on close.
   */
  function activateTrap(): void {
    // Only overwrite if saveFocus() was not already called before the tick
    if (!previouslyFocusedElement) {
      previouslyFocusedElement = document.activeElement as HTMLElement
    }

    // Prevent the body from scrolling while the overlay is open
    document.body.style.overflow = 'hidden'

    if (manageInert) setAppInert(true)

    // Move focus into the overlay
    const initialTarget = initialFocusRef?.value ?? containerRef.value
    initialTarget?.focus()

    // Begin trapping Tab
    cleanupTabListener = installTabListener()
  }

  /**
   * Deactivates the trap and restores pre-open state.
   *
   * Safe to call even if the trap was never activated.
   */
  function deactivateTrap(): void {
    document.body.style.overflow = ''

    if (manageInert) setAppInert(false)

    cleanupTabListener?.()
    cleanupTabListener = null

    previouslyFocusedElement?.focus()
    previouslyFocusedElement = null
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  // If the component is unmounted while the trap is active (e.g. navigating away
  // while a modal is open) make sure we do not leave the page in a broken state.
  onUnmounted(() => {
    document.body.style.overflow = ''
    if (manageInert) setAppInert(false)
    cleanupTabListener?.()
  })

  return { saveFocus, activateTrap, deactivateTrap }
}

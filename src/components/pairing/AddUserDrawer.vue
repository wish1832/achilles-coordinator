<template>
  <!--
    AddUserDrawer: A right-side slide-in panel for adding org members to a run.

    This drawer lists all athletes and guides in the organization, lets the
    organizer search by name, and clicking "Add" on a user creates a sign-up
    record for them in the current run.

    Accessibility:
    - role="dialog" with aria-modal="true" so screen readers treat it as a modal
    - Focus is trapped inside the drawer while it is open
    - The background page gets the `inert` attribute so keyboard users cannot
      reach content behind the drawer
    - Escape key closes the drawer
    - On close, focus returns to the element that triggered the drawer
    - Body scroll is locked while the drawer is open
  -->
  <Teleport to="body">
    <div v-if="isOpen" :class="['add-user-drawer-root', accessibilityStore.accessibilityClasses]">
      <!-- Semi-transparent backdrop; clicking it closes the drawer -->
      <div class="drawer-backdrop" aria-hidden="true" @click="$emit('close')" />

      <!-- Drawer panel -->
      <div
        ref="drawerRef"
        class="add-user-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-drawer-title"
        @keydown.esc.prevent="emit('close')"
      >
        <!-- ── Header ── -->
        <header class="drawer__header">
          <h2 id="add-user-drawer-title" class="drawer__title">Add User to Run</h2>

          <!-- Close button -->
          <AchillesButton
            variant="ghost"
            size="small"
            aria-label="Close drawer"
            class="drawer__close"
            @click="$emit('close')"
          >
            <svg class="drawer__close-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </AchillesButton>
        </header>

        <!-- ── Search bar ── -->
        <div class="drawer__search">
          <!--
            The label is visually hidden but readable by screen readers.
            The input uses type="search" to get the native clear button on
            supported browsers and the correct virtual keyboard on mobile.
          -->
          <label for="add-user-search" class="sr-only">Search users by name</label>
          <input
            id="add-user-search"
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            class="drawer__search-input"
            placeholder="Search by name…"
            autocomplete="off"
          />
        </div>

        <!-- ── Scrollable content ── -->
        <div class="drawer__content">
          <!-- Athletes section -->
          <section class="drawer__section" aria-labelledby="drawer-athletes-heading">
            <h3 id="drawer-athletes-heading" class="drawer__section-heading">Athletes</h3>

            <ul class="drawer__user-list" role="list" aria-label="Athletes">
              <li
                v-for="user in filteredAthletes"
                :key="user.id"
                class="drawer__user-row"
                :class="{ 'drawer__user-row--signed-up': signedUpUserIds.has(user.id) || recentlyAddedUserIds.has(user.id) }"
              >
                <!-- Avatar (decorative; the name provides the accessible label) -->
                <UserAvatar
                  :display-name="user.displayName"
                  size="medium"
                  :aria-hidden="true"
                  class="drawer__user-avatar"
                />

                <!-- Name -->
                <span class="drawer__user-name">{{ user.displayName }}</span>

                <!-- Right side: "Added" badge for users just added this session -->
                <span v-if="recentlyAddedUserIds.has(user.id)" class="drawer__added-badge" aria-label="Added to run">
                  <font-awesome-icon icon="circle-check" class="drawer__added-icon" aria-hidden="true" />
                  <span class="drawer__added-text">Added</span>
                </span>

                <!-- Already-signed-up indicator for users with pre-existing sign-ups -->
                <span v-else-if="signedUpUserIds.has(user.id)" class="drawer__signed-up-badge" aria-label="Already signed up">
                  <font-awesome-icon icon="circle-check" class="drawer__signed-up-icon" aria-hidden="true" />
                  <span class="drawer__signed-up-text">Already signed up</span>
                </span>

                <AchillesButton
                  v-else
                  variant="secondary"
                  size="small"
                  :loading="addingUserId === user.id"
                  :disabled="addingUserId !== null"
                  :aria-label="`Add ${user.displayName} to run`"
                  @click="() => { console.log('[AddUserDrawer] add-user emit for:', user.id); $emit('add-user', user.id) }"
                >
                  Add
                </AchillesButton>
              </li>

              <!-- Empty state when search returns no athletes -->
              <li v-if="filteredAthletes.length === 0" class="drawer__empty" role="listitem">
                No athletes found.
              </li>
            </ul>
          </section>

          <!-- Guides section -->
          <section class="drawer__section" aria-labelledby="drawer-guides-heading">
            <h3 id="drawer-guides-heading" class="drawer__section-heading">Guides</h3>

            <ul class="drawer__user-list" role="list" aria-label="Guides">
              <li
                v-for="user in filteredGuides"
                :key="user.id"
                class="drawer__user-row"
                :class="{ 'drawer__user-row--signed-up': signedUpUserIds.has(user.id) || recentlyAddedUserIds.has(user.id) }"
              >
                <UserAvatar
                  :display-name="user.displayName"
                  size="medium"
                  :aria-hidden="true"
                  class="drawer__user-avatar"
                />

                <span class="drawer__user-name">{{ user.displayName }}</span>

                <!-- "Added" badge for users just added this session -->
                <span v-if="recentlyAddedUserIds.has(user.id)" class="drawer__added-badge" aria-label="Added to run">
                  <font-awesome-icon icon="circle-check" class="drawer__added-icon" aria-hidden="true" />
                  <span class="drawer__added-text">Added</span>
                </span>

                <!-- Already-signed-up indicator for users with pre-existing sign-ups -->
                <span v-else-if="signedUpUserIds.has(user.id)" class="drawer__signed-up-badge" aria-label="Already signed up">
                  <font-awesome-icon icon="circle-check" class="drawer__signed-up-icon" aria-hidden="true" />
                  <span class="drawer__signed-up-text">Already signed up</span>
                </span>

                <AchillesButton
                  v-else
                  variant="secondary"
                  size="small"
                  :loading="addingUserId === user.id"
                  :disabled="addingUserId !== null"
                  :aria-label="`Add ${user.displayName} to run`"
                  @click="() => { console.log('[AddUserDrawer] add-user emit for:', user.id); $emit('add-user', user.id) }"
                >
                  Add
                </AchillesButton>
              </li>

              <li v-if="filteredGuides.length === 0" class="drawer__empty" role="listitem">
                No guides found.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import type { User } from '@/types'

// ── Props & emits ──────────────────────────────────────────────────────────

interface Props {
  /** Whether the drawer is currently visible */
  isOpen: boolean
  /** All organization members (athletes and guides) to display */
  orgMembers: User[]
  /** Set of user IDs that already had a sign-up before the drawer was opened */
  signedUpUserIds: Set<string>
  /** ID of the user currently being added (shows a loading spinner on their row) */
  addingUserId: string | null
  /**
   * Set of user IDs added during the current drawer session.
   * These show a "✓ Added" badge instead of the generic "Already signed up" badge.
   */
  recentlyAddedUserIds: Set<string>
}

interface Emits {
  /** Emitted when the drawer should close */
  close: []
  /** Emitted when the organizer clicks Add on a user row */
  'add-user': [userId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ── Stores ─────────────────────────────────────────────────────────────────

// Used to apply the global accessibility classes (high-contrast, text-size, etc.)
const accessibilityStore = useAccessibilityStore()

// ── Refs ───────────────────────────────────────────────────────────────────

/** The drawer panel element — used for focus trapping */
const drawerRef = ref<HTMLElement | null>(null)

/** The search input — receives focus when the drawer opens */
const searchInputRef = ref<HTMLInputElement | null>(null)

/** The element that had focus before the drawer opened; focus returns here on close */
const previouslyFocusedElement = ref<HTMLElement | null>(null)

/** Current value of the search input */
const searchQuery = ref('')

// ── Filtering ──────────────────────────────────────────────────────────────

/**
 * Athletes from the org member list, filtered by the search query.
 * Comparison is case-insensitive and ignores leading/trailing whitespace.
 */
const filteredAthletes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return props.orgMembers.filter(
    (user) => user.role === 'athlete' && user.displayName.toLowerCase().includes(query),
  )
})

/**
 * Guides from the org member list, filtered by the search query.
 */
const filteredGuides = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return props.orgMembers.filter(
    (user) => user.role === 'guide' && user.displayName.toLowerCase().includes(query),
  )
})

// ── Focus trap ─────────────────────────────────────────────────────────────

/**
 * Sets up a Tab/Shift+Tab focus trap inside the drawer panel.
 * Returns a cleanup function that removes the event listener.
 */
function setupFocusTrap(): () => void {
  const panel = drawerRef.value
  if (!panel) return () => {}

  function handleTabKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    // Collect all focusable elements currently inside the drawer
    const focusable = panel!.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return

    const firstFocusable = focusable[0]
    const lastFocusable = focusable[focusable.length - 1]

    // Guard: both ends must exist (they will whenever focusable.length > 0)
    if (!firstFocusable || !lastFocusable) return

    if (event.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }
  }

  panel.addEventListener('keydown', handleTabKey)
  return () => panel.removeEventListener('keydown', handleTabKey)
}

// ── Open/close lifecycle ───────────────────────────────────────────────────

/**
 * Reference to the active focus trap cleanup function.
 * Stored so we can tear it down when the drawer closes.
 */
let cleanupFocusTrap: (() => void) | null = null

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      // Save the element that currently has focus so we can restore it on close
      previouslyFocusedElement.value = document.activeElement as HTMLElement

      // Prevent the background page from scrolling while the drawer is open
      document.body.style.overflow = 'hidden'

      // Make the background page inert so keyboard/AT users cannot reach it
      const appRoot = document.getElementById('app')
      if (appRoot) appRoot.setAttribute('inert', '')

      // Clear stale search from a previous session
      searchQuery.value = ''

      // Wait for Vue to render the drawer DOM before focusing / trapping
      await nextTick()

      // Move focus into the drawer (search input is the most useful first target)
      searchInputRef.value?.focus()

      // Activate the focus trap
      cleanupFocusTrap = setupFocusTrap()
    } else {
      // Restore background interactivity
      document.body.style.overflow = ''

      const appRoot = document.getElementById('app')
      if (appRoot) appRoot.removeAttribute('inert')

      // Tear down the focus trap
      cleanupFocusTrap?.()
      cleanupFocusTrap = null

      // Return focus to the element that opened the drawer
      previouslyFocusedElement.value?.focus()
    }
  },
)

// Ensure cleanup runs if the component is unmounted while the drawer is open
onUnmounted(() => {
  document.body.style.overflow = ''
  const appRoot = document.getElementById('app')
  if (appRoot) appRoot.removeAttribute('inert')
  cleanupFocusTrap?.()
})
</script>

<style scoped>
/* ==========================================
   Root container (covers viewport)
   ========================================== */

.add-user-drawer-root {
  /* Fixed so it overlays the entire viewport */
  position: fixed;
  inset: 0;
  /* Ensure the drawer sits above other page content */
  z-index: 1000;
}

/* ==========================================
   Backdrop
   ========================================== */

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  animation: fade-in 0.2s ease-out;
}

/* ==========================================
   Drawer panel
   ========================================== */

.add-user-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  /* Fixed width on larger screens, full width on small */
  width: min(24rem, 100vw);

  display: flex;
  flex-direction: column;

  background-color: var(--color-bg, #ffffff);
  border-left: 1px solid var(--color-border, #e5e7eb);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);

  animation: slide-in 0.25s ease-out;
  outline: none;
  overflow: hidden;
}

/* ==========================================
   Header
   ========================================== */

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

.drawer__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.4;
}

.drawer__close {
  /* Pull close button to the right edge with a small visual offset */
  flex-shrink: 0;
  padding: 0.375rem;
  margin: -0.375rem -0.25rem -0.375rem 0;
}

.drawer__close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* ==========================================
   Search bar
   ========================================== */

.drawer__search {
  padding: 0.75rem 1.25rem;
  flex-shrink: 0;
}

.drawer__search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  color: var(--color-text, #111827);
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s ease;
}

.drawer__search-input:focus {
  border-color: var(--color-primary, #0066cc);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
}

/* ==========================================
   Scrollable content area
   ========================================== */

.drawer__content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}

/* ==========================================
   Section headings (Athletes / Guides)
   ========================================== */

.drawer__section {
  padding: 0 0 0.5rem 0;
}

.drawer__section-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  padding: 0.5rem 1.25rem;
}

/* ==========================================
   User list
   ========================================== */

.drawer__user-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Each user row */
.drawer__user-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  transition: background-color 0.1s ease;
}

.drawer__user-row:hover {
  background-color: var(--color-bg-hover, #f3f4f6);
}

/* Signed-up rows are visually dimmed */
.drawer__user-row--signed-up {
  opacity: 0.6;
}

.drawer__user-row--signed-up:hover {
  /* Don't highlight a non-interactive row */
  background-color: transparent;
}

/* Avatar */
.drawer__user-avatar {
  flex-shrink: 0;
}

/* Name takes up remaining horizontal space */
.drawer__user-name {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text, #111827);
  line-height: 1.4;
  /* Truncate very long names gracefully */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==========================================
   Already-signed-up badge
   ========================================== */

.drawer__signed-up-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: var(--color-success, #28a745);
  font-size: 0.8125rem;
  font-weight: 500;
}

.drawer__signed-up-icon {
  font-size: 0.9375rem;
}

.drawer__signed-up-text {
  /* Hide text on narrow screens to save space, keep icon */
  white-space: nowrap;
}

/* ==========================================
   Added badge (users added in the current session)
   ========================================== */

/* Uses a slightly brighter green than the signed-up badge to feel more
   immediate/actionable, signalling the add just happened */
.drawer__added-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: var(--color-success, #28a745);
  font-size: 0.8125rem;
  font-weight: 600;
}

.drawer__added-icon {
  font-size: 0.9375rem;
}

.drawer__added-text {
  white-space: nowrap;
}

/* ==========================================
   Empty state
   ========================================== */

.drawer__empty {
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
}

/* ==========================================
   Visually hidden (accessible labels)
   ========================================== */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ==========================================
   Animations
   ========================================== */

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* Respect user's reduced-motion preference */
.reduced-motion .add-user-drawer,
.reduced-motion .drawer-backdrop {
  animation: none;
}

/* ==========================================
   High contrast mode
   ========================================== */

.high-contrast .add-user-drawer {
  border-left: 2px solid var(--color-text, #000000);
}

.high-contrast .drawer__search-input {
  border: 2px solid var(--color-text, #000000);
}

/* ==========================================
   Text size support
   ========================================== */

.text-size-small .drawer__title    { font-size: 1rem; }
.text-size-small .drawer__user-name { font-size: 0.875rem; }
.text-size-small .drawer__search-input { font-size: 0.875rem; }

.text-size-large .drawer__title    { font-size: 1.25rem; }
.text-size-large .drawer__user-name { font-size: 1.0625rem; }
.text-size-large .drawer__search-input { font-size: 1.0625rem; }

.text-size-extra-large .drawer__title { font-size: 1.375rem; }
.text-size-extra-large .drawer__user-name { font-size: 1.125rem; }
.text-size-extra-large .drawer__search-input { font-size: 1.125rem; }
</style>

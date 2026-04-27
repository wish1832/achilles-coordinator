<template>
  <header class="app-header">
    <div class="app-header__content">
      <!-- Left side: Back button (shown only when a back destination is set by the current view) -->
      <div class="app-header__left">
        <button
          v-if="backLabel"
          class="app-header__back-button"
          :aria-label="`Back to ${backLabel}`"
          @click="goBack"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" aria-hidden="true" />
        </button>
      </div>

      <!-- Right side: User menu and page-specific actions -->
      <div class="app-header__right">
        <!-- User menu dropdown -->
        <div class="user-menu" ref="userMenuRef">
          <!-- User avatar button that triggers the dropdown -->
          <button
            class="user-menu__trigger"
            ref="triggerButtonRef"
            :aria-label="`User menu for ${displayName}`"
            aria-haspopup="menu"
            :aria-expanded="isDropdownOpen"
            @click="toggleDropdown"
            @keydown="handleTriggerKeydown"
          >
            <UserAvatar
              :display-name="displayName"
              size="medium"
              variant="header"
              aria-hidden
            />
          </button>

          <!-- Dropdown menu -->
          <div
            v-show="isDropdownOpen"
            class="user-menu__dropdown"
            role="menu"
            :aria-label="`Menu for ${displayName}`"
          >
            <!-- Settings option -->
            <button
              class="user-menu__item"
              role="menuitem"
              @click="goToSettings"
              @keydown="handleMenuItemKeydown($event, 0)"
              ref="settingsButtonRef"
            >
              <font-awesome-icon
                :icon="['fas', 'gear']"
                class="user-menu__icon"
                aria-hidden="true"
              />
              <span>Settings</span>
            </button>

            <!-- Log out option -->
            <button
              class="user-menu__item"
              role="menuitem"
              @click="handleLogout"
              @keydown="handleMenuItemKeydown($event, 1)"
              ref="logoutButtonRef"
            >
              <font-awesome-icon
                :icon="['fas', 'arrow-right-from-bracket']"
                class="user-menu__icon"
                aria-hidden="true"
              />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'
import UserAvatar from '@/components/ui/UserAvatar.vue'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// The label set by the current view. Null means no back button should be shown.
const backLabel = computed(() => navigationStore.backLabel)

// Refs for DOM elements
const userMenuRef = ref<HTMLElement | null>(null)
const triggerButtonRef = ref<HTMLButtonElement | null>(null)
const settingsButtonRef = ref<HTMLButtonElement | null>(null)
const logoutButtonRef = ref<HTMLButtonElement | null>(null)

// Dropdown state
const isDropdownOpen = ref(false)

// Computed: Get the user's display name from the auth store
const displayName = computed(() => authStore.userDisplayName || 'User')

// Navigate back using the previousRoute recorded by the router guard.
// This is deterministic and works correctly on deep links and page refreshes,
// unlike router.back() which relies on browser history being in sync with in-app routes.
// Falls back to /dashboard when there is no recorded previous route.
function goBack(): void {
  const previousRoute = navigationStore.previousRoute
  if (previousRoute?.name) {
    router.push({ name: previousRoute.name, params: previousRoute.params })
    return
  }
  router.push('/dashboard')
}

// Toggle the dropdown menu open/closed
function toggleDropdown(): void {
  isDropdownOpen.value = !isDropdownOpen.value

  // When opening, focus the first menu item after the dropdown renders
  if (isDropdownOpen.value) {
    nextTick(() => {
      settingsButtonRef.value?.focus()
    })
  }
}

// Close the dropdown menu.
// When shouldReturnFocus is true (e.g. Escape key), focus returns to the trigger button
// so keyboard users aren't left with focus lost in the DOM.
function closeDropdown(shouldReturnFocus = false): void {
  isDropdownOpen.value = false
  if (shouldReturnFocus) {
    nextTick(() => {
      triggerButtonRef.value?.focus()
    })
  }
}

// Navigate to the settings page
function goToSettings(): void {
  closeDropdown()
  router.push('/settings')
}

// Handle user logout
async function handleLogout(): Promise<void> {
  closeDropdown()
  try {
    await authStore.signOut()
    // Navigate to login page after successful logout
    router.push('/login')
  } catch (error) {
    // Log error but still navigate to login since signOut clears local state
    console.error('Logout error:', error)
    router.push('/login')
  }
}

// Handle keyboard navigation on the trigger button
function handleTriggerKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      // Open dropdown and focus first item
      event.preventDefault()
      if (!isDropdownOpen.value) {
        isDropdownOpen.value = true
        nextTick(() => {
          settingsButtonRef.value?.focus()
        })
      }
      break
    case 'Escape':
      // Close dropdown and return focus to trigger
      event.preventDefault()
      closeDropdown(true)
      break
  }
}

// Handle keyboard navigation within the menu items
// itemIndex: 0 = settings, 1 = logout
function handleMenuItemKeydown(event: KeyboardEvent, itemIndex: number): void {
  const menuItems = [settingsButtonRef.value, logoutButtonRef.value]

  switch (event.key) {
    case 'ArrowDown':
      // Move to next item, wrap to first if at end
      event.preventDefault()
      const nextIndex = (itemIndex + 1) % menuItems.length
      menuItems[nextIndex]?.focus()
      break
    case 'ArrowUp':
      // Move to previous item, wrap to last if at beginning
      event.preventDefault()
      const prevIndex = itemIndex === 0 ? menuItems.length - 1 : itemIndex - 1
      menuItems[prevIndex]?.focus()
      break
    case 'Escape':
      // Close dropdown and return focus to the trigger button
      event.preventDefault()
      closeDropdown(true)
      break
    case 'Tab':
      // Close dropdown when tabbing out
      closeDropdown()
      break
    case 'Home':
      // Jump to first item
      event.preventDefault()
      menuItems[0]?.focus()
      break
    case 'End':
      // Jump to last item
      event.preventDefault()
      menuItems[menuItems.length - 1]?.focus()
      break
  }
}

// Close dropdown when clicking outside of it
function handleClickOutside(event: MouseEvent): void {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Set up and tear down click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style scoped>
/* Header container */
.app-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* Header content layout */
.app-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Left side - logo/title */
.app-header__left {
  display: flex;
  align-items: center;
}

.app-header__back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  font-size: 1.25rem;
  transition: background-color 0.2s ease-in-out;
}

.app-header__back-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.app-header__back-button:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Right side - user menu area */
.app-header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}


/* User menu container */
.user-menu {
  position: relative;
}

/* User menu trigger button (avatar) */
.user-menu__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.user-menu__trigger:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.user-menu__trigger:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Dropdown menu */
.user-menu__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 10rem;
  background-color: var(--color-card-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
  padding: 0.25rem 0;
  z-index: 101;
}

/* Menu items */
.user-menu__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--color-text, #111827);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.user-menu__item:hover {
  background-color: var(--color-bg-secondary, #f9fafb);
}

.user-menu__item:focus-visible {
  outline: none;
  background-color: var(--color-bg-tertiary, #f3f4f6);
}

/* Danger variant for logout */
.user-menu__item--danger:hover,
.user-menu__item--danger:focus-visible {
  background-color: var(--color-error-bg, #fef2f2);
  color: var(--color-error, #dc2626);
}

/* Menu item icons */
.user-menu__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* High contrast mode */
.high-contrast .app-header {
  background: var(--color-primary, #000000);
  border-bottom: 2px solid white;
}

.high-contrast .user-menu__trigger {
  border-color: white;
}

.high-contrast .user-menu__dropdown {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .user-menu__item:focus-visible {
  outline: 2px solid var(--color-focus, #000000);
  outline-offset: -2px;
}

/* Reduced motion */
.reduced-motion .app-header__back-button,
.reduced-motion .user-menu__trigger,
.reduced-motion .user-menu__item {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .app-header__content {
    padding: 0 0.75rem;
  }

  .user-menu__trigger {
    width: 2.25rem;
    height: 2.25rem;
  }
}
</style>

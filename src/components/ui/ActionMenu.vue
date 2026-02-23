<template>
  <!--
    ActionMenu: A dropdown menu triggered by an ellipsis button.
    Provides accessible keyboard navigation and focus management.
    Used for contextual actions on list items (e.g., user management).
  -->
  <div class="action-menu" :class="accessibilityStore.accessibilityClasses">
    <!-- Trigger button with ellipsis icon -->
    <button
      ref="triggerRef"
      type="button"
      class="action-menu__trigger"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :aria-controls="menuId"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <font-awesome-icon icon="ellipsis" aria-hidden="true" />
    </button>

    <!-- Dropdown menu -->
    <ul
      v-show="isOpen"
      :id="menuId"
      ref="menuRef"
      role="menu"
      class="action-menu__dropdown"
      tabindex="-1"
      @keydown="handleMenuKeydown"
    >
      <!-- Menu items are provided via slot or items prop -->
      <li
        v-for="(item, index) in items"
        :key="item.id"
        :id="`${menuId}-item-${index}`"
        role="menuitem"
        class="action-menu__item"
        :class="{
          'action-menu__item--active': activeIndex === index,
          'action-menu__item--danger': item.danger,
        }"
        tabindex="-1"
        @click="handleItemClick(item)"
        @mouseenter="activeIndex = index"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'

// Interface for menu items
export interface ActionMenuItem {
  id: string
  label: string
  danger?: boolean
}

// Props interface
interface Props {
  items: ActionMenuItem[]
  ariaLabel?: string
}

// Emits interface
interface Emits {
  select: [item: ActionMenuItem]
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Actions',
})

const emit = defineEmits<Emits>()

// Accessibility store for global accessibility classes
const accessibilityStore = useAccessibilityStore()

// Template refs
const triggerRef = ref<HTMLButtonElement>()
const menuRef = ref<HTMLUListElement>()

// Menu state
const isOpen = ref(false)
const activeIndex = ref(-1)

// Generate unique ID for accessibility associations
const uniqueId = Math.random().toString(36).substring(2, 9)
const menuId = computed(() => `action-menu-${uniqueId}`)

/**
 * Toggle the menu open/closed
 */
function toggleMenu(): void {
  if (isOpen.value) {
    closeMenu()
  } else {
    openMenu()
  }
}

/**
 * Open the menu and focus the first item
 */
function openMenu(): void {
  if (props.items.length === 0) return

  isOpen.value = true
  activeIndex.value = 0

  // Focus the menu after it becomes visible
  nextTick(() => {
    menuRef.value?.focus()
  })
}

/**
 * Close the menu and return focus to the trigger button
 */
function closeMenu(): void {
  isOpen.value = false
  activeIndex.value = -1
  triggerRef.value?.focus()
}

/**
 * Handle menu item click
 */
function handleItemClick(item: ActionMenuItem): void {
  emit('select', item)
  closeMenu()
}

/**
 * Handle keydown events on the trigger button
 */
function handleTriggerKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case ' ':
    case 'Enter':
      event.preventDefault()
      openMenu()
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeMenu()
      }
      break
  }
}

/**
 * Handle keydown events on the menu
 * Provides full keyboard navigation
 */
function handleMenuKeydown(event: KeyboardEvent): void {
  const lastIndex = props.items.length - 1

  switch (event.key) {
    case 'ArrowDown':
      // Move to next item, wrap to first if at end
      event.preventDefault()
      activeIndex.value = activeIndex.value < lastIndex ? activeIndex.value + 1 : 0
      break

    case 'ArrowUp':
      // Move to previous item, wrap to last if at beginning
      event.preventDefault()
      activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : lastIndex
      break

    case 'Home':
      // Jump to first item
      event.preventDefault()
      activeIndex.value = 0
      break

    case 'End':
      // Jump to last item
      event.preventDefault()
      activeIndex.value = lastIndex
      break

    case 'Enter':
    case ' ':
      // Select the active item
      event.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value <= lastIndex) {
        const selectedItem = props.items[activeIndex.value]
        if (selectedItem) {
          handleItemClick(selectedItem)
        }
      }
      break

    case 'Escape':
      // Close without selecting
      event.preventDefault()
      closeMenu()
      break

    case 'Tab':
      // Close on tab and allow normal tab behavior
      closeMenu()
      break
  }
}

/**
 * Handle clicks outside the menu to close it
 */
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (
    isOpen.value &&
    !triggerRef.value?.contains(target) &&
    !menuRef.value?.contains(target)
  ) {
    closeMenu()
  }
}

// Set up click outside listener when component mounts
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

// Clean up listener when component unmounts
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style scoped>
/* Container for relative positioning of the dropdown */
.action-menu {
  position: relative;
  display: inline-block;
}

/* Trigger button styled as an icon button */
.action-menu__trigger {
  /* Reset button defaults */
  appearance: none;
  background: none;
  border: none;
  cursor: pointer;

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;

  /* Visual styling */
  color: var(--color-text-muted, #6b7280);
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;

  /* Focus styles */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.action-menu__trigger:hover {
  background-color: var(--color-bg-hover, #f3f4f6);
  color: var(--color-text, #111827);
}

.action-menu__trigger:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Dropdown menu */
.action-menu__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;

  /* Layout */
  list-style: none;
  margin: 0.25rem 0 0 0;
  padding: 0.25rem 0;
  min-width: 10rem;

  /* Visual styling */
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Individual menu item */
.action-menu__item {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text, #111827);
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  white-space: nowrap;
}

.action-menu__item:hover,
.action-menu__item--active {
  background-color: var(--color-bg-hover, #f3f4f6);
}

/* Danger variant for destructive actions */
.action-menu__item--danger {
  color: var(--color-error, #dc2626);
}

.action-menu__item--danger:hover,
.action-menu__item--danger.action-menu__item--active {
  background-color: var(--color-error-light, #fef2f2);
}

/* High contrast mode */
.high-contrast .action-menu__trigger:focus-visible {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

.high-contrast .action-menu__dropdown {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .action-menu__item--active {
  outline: 2px solid var(--color-text, #000000);
  outline-offset: -2px;
}

/* Reduced motion support */
.reduced-motion .action-menu__trigger,
.reduced-motion .action-menu__item {
  transition: none;
}
</style>

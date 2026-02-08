<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal-overlay"
      :class="overlayClasses"
      role="dialog"
      :aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      @click="handleOverlayClick"
      @keydown="handleKeydown"
    >
      <div ref="modalRef" class="modal" :class="modalClasses" role="document" @click.stop>
        <!-- Modal header -->
        <header v-if="title || $slots.header" class="modal__header">
          <slot name="header">
            <h2 :id="titleId" class="modal__title">{{ title }}</h2>
            <p v-if="description" :id="descriptionId" class="modal__description">
              {{ description }}
            </p>
          </slot>

          <!-- Close button -->
          <AchillesButton
            v-if="closable"
            variant="ghost"
            size="small"
            :aria-label="closeButtonLabel"
            class="modal__close"
            @click="close"
          >
            <svg class="modal__close-icon" viewBox="0 0 24 24" aria-hidden="true">
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

        <!-- Modal content -->
        <div class="modal__content">
          <slot />
        </div>

        <!-- Modal footer -->
        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'
import AchillesButton from './AchillesButton.vue'

// Props with comprehensive accessibility support
interface Props {
  // Content
  title?: string
  description?: string

  // Behavior
  isOpen: boolean
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean

  // Accessibility
  closeButtonLabel?: string

  // Visual variants
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  variant?: 'default' | 'centered' | 'bottom-sheet'

  // Additional classes
  class?: string
}

// Emits
interface Emits {
  close: []
  'update:isOpen': [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  closeButtonLabel: 'Close modal',
  size: 'medium',
  variant: 'centered',
})

const emit = defineEmits<Emits>()

// Refs
const modalRef = ref<HTMLElement>()
const previouslyFocusedElement = ref<HTMLElement | null>(null)

// Accessibility store
const accessibilityStore = useAccessibilityStore()

// Generate unique IDs for accessibility
const titleId = computed(() =>
  props.title ? `modal-title-${Math.random().toString(36).substr(2, 9)}` : undefined,
)
const descriptionId = computed(() =>
  props.description ? `modal-description-${Math.random().toString(36).substr(2, 9)}` : undefined,
)

// Computed classes
const overlayClasses = computed(() => {
  return [accessibilityStore.accessibilityClasses, props.class].filter(Boolean).join(' ')
})

const modalClasses = computed(() => {
  return [`modal--${props.size}`, `modal--${props.variant}`].join(' ')
})

// Focus management
function trapFocus() {
  if (!modalRef.value) return

  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  modalRef.value.addEventListener('keydown', handleTabKey)

  // Return cleanup function
  return () => {
    modalRef.value?.removeEventListener('keydown', handleTabKey)
  }
}

// Event handlers
function close(): void {
  emit('close')
  emit('update:isOpen', false)
}

function handleOverlayClick(event: MouseEvent): void {
  if (props.closeOnOverlay && event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.closeOnEscape) {
    close()
  }
}

// Watch for modal open/close to manage focus
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      // Store currently focused element
      previouslyFocusedElement.value = document.activeElement as HTMLElement

      // Wait for DOM update
      await nextTick()

      // Focus the modal
      if (modalRef.value) {
        modalRef.value.focus()
      }

      // Set up focus trap
      const cleanup = trapFocus()

      // Store cleanup function for later
      modalRef.value?.setAttribute('data-cleanup', 'true')

      // Clean up on unmount
      onUnmounted(cleanup)
    } else {
      // Restore focus to previously focused element
      if (previouslyFocusedElement.value) {
        previouslyFocusedElement.value.focus()
      }
    }
  },
)

// Handle body scroll lock
function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = ''
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      lockBodyScroll()
    } else {
      unlockBodyScroll()
    }
  },
)

// Cleanup on unmount
onUnmounted(() => {
  unlockBodyScroll()
})
</script>

<style scoped>
/* Modal overlay - covers entire viewport */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  /* Backdrop */
  background-color: var(--color-overlay, rgba(0, 0, 0, 0.5));

  /* Animation */
  opacity: 0;
  animation: fadeIn 0.2s ease-out forwards;
}

/* Modal container */
.modal {
  /* Layout */
  display: flex;
  flex-direction: column;

  /* Visual styling */
  background-color: var(--color-modal-bg, #ffffff);
  border-radius: 0.5rem;
  box-shadow: var(
    --shadow-modal,
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04)
  );

  /* Focus styles */
  outline: none;
}

.modal:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Size variants */
.modal--small {
  width: 90%;
  max-width: 24rem;
  max-height: 80vh;
}

.modal--medium {
  width: 90%;
  max-width: 32rem;
  max-height: 80vh;
}

.modal--large {
  width: 90%;
  max-width: 48rem;
  max-height: 80vh;
}

.modal--fullscreen {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

/* Variant positioning */
.modal--centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: slideIn 0.2s ease-out;
}

.modal--bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0.5rem 0.5rem 0 0;
  animation: slideUp 0.2s ease-out;
}

/* Modal sections */
.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0 1.5rem;
  flex-shrink: 0;
}

.modal__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  line-height: 1.4;
}

.modal__description {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.4;
}

.modal__close {
  flex-shrink: 0;
  padding: 0.5rem;
  margin: -0.5rem -0.5rem -0.5rem 0;
}

.modal__close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.modal__content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  color: var(--color-text, #111827);
  line-height: 1.6;
}

.modal__footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  flex-shrink: 0;
  border-top: 1px solid var(--color-border, #e5e7eb);
  margin-top: 1rem;
  padding-top: 1rem;
}

/* Text size support */
.text-size-small .modal__title {
  font-size: 1.125rem;
}

.text-size-small .modal__description {
  font-size: 0.8125rem;
}

.text-size-large .modal__title {
  font-size: 1.375rem;
}

.text-size-large .modal__description {
  font-size: 0.9375rem;
}

.text-size-extra-large .modal__title {
  font-size: 1.5rem;
}

/* ==========================================
   Animations
   ========================================== */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>

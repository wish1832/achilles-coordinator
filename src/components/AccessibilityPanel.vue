<template>
  <div class="accessibility-panel">
    <!-- Toggle button -->
    <AchillesButton
      variant="ghost"
      size="small"
      :aria-label="isOpen ? 'Close accessibility settings' : 'Open accessibility settings'"
      :aria-expanded="isOpen"
      class="accessibility-toggle"
      @click="togglePanel"
    >
      <svg class="accessibility-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span class="accessibility-label">Accessibility</span>
    </AchillesButton>

    <!-- Panel content -->
    <div
      v-if="isOpen"
      class="accessibility-content"
      role="dialog"
      :aria-labelledby="panelTitleId"
      :aria-describedby="panelDescriptionId"
    >
      <div class="accessibility-header">
        <h3 :id="panelTitleId" class="accessibility-title">Accessibility Settings</h3>
        <p :id="panelDescriptionId" class="accessibility-description">
          Customize your experience with these accessibility options
        </p>
      </div>

      <div class="accessibility-options">
        <!-- High contrast toggle -->
        <div class="accessibility-option">
          <label class="accessibility-option-label">
            <input
              type="checkbox"
              :checked="accessibilityStore.isHighContrast"
              class="accessibility-checkbox"
              @change="accessibilityStore.toggleHighContrast"
            />
            <span class="accessibility-checkbox-label">High Contrast Mode</span>
          </label>
          <p class="accessibility-option-description">Increases contrast for better visibility</p>
        </div>

        <!-- Text size selector -->
        <div class="accessibility-option">
          <label class="accessibility-option-label" for="text-size-select"> Text Size </label>
          <select
            id="text-size-select"
            :value="accessibilityStore.textSize"
            class="accessibility-select"
            @change="handleTextSizeChange"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
          <p class="accessibility-option-description">
            Adjust the size of text throughout the application
          </p>
        </div>

        <!-- Reduced motion toggle -->
        <div class="accessibility-option">
          <label class="accessibility-option-label">
            <input
              type="checkbox"
              :checked="accessibilityStore.isReducedMotion"
              class="accessibility-checkbox"
              @change="accessibilityStore.toggleReducedMotion"
            />
            <span class="accessibility-checkbox-label">Reduce Motion</span>
          </label>
          <p class="accessibility-option-description">Minimizes animations and transitions</p>
        </div>

        <!-- Focus indicators toggle -->
        <div class="accessibility-option">
          <label class="accessibility-option-label">
            <input
              type="checkbox"
              :checked="accessibilityStore.isFocusVisible"
              class="accessibility-checkbox"
              @change="accessibilityStore.toggleFocusVisible"
            />
            <span class="accessibility-checkbox-label">Enhanced Focus Indicators</span>
          </label>
          <p class="accessibility-option-description">Makes focus indicators more prominent</p>
        </div>
      </div>

      <div class="accessibility-footer">
        <AchillesButton variant="secondary" size="small" @click="accessibilityStore.resetSettings">
          Reset to Defaults
        </AchillesButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'
import AchillesButton from '@/components/ui/AchillesButton.vue'

// Accessibility store
const accessibilityStore = useAccessibilityStore()

// State
const isOpen = ref(false)

// Generate unique IDs for accessibility
const panelTitleId = computed(() => 'accessibility-panel-title')
const panelDescriptionId = computed(() => 'accessibility-panel-description')

// Event handlers
function togglePanel(): void {
  isOpen.value = !isOpen.value
}

function handleTextSizeChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  // treat the select value as unknown then validate/assign
  const value = target.value as unknown
  accessibilityStore.setTextSize(String(value) as 'small' | 'medium' | 'large' | 'extra-large')
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent): void {
  // Alt + A to toggle accessibility panel
  if (event.altKey && event.key === 'a') {
    event.preventDefault()
    togglePanel()
  }

  // Escape to close panel
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Main container */
.accessibility-panel {
  position: relative;
  display: inline-block;
}

/* Toggle button */
.accessibility-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  transition: all 0.2s ease-in-out;
}

.accessibility-toggle:hover {
  background-color: var(--color-ghost-hover, #f8f9fa);
  border-color: var(--color-primary, #0066cc);
}

.accessibility-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted, #6b7280);
}

.accessibility-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #111827);
}

/* Panel content */
.accessibility-content {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 20rem;
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(
    --shadow-lg,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05)
  );
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
}

/* Panel header */
.accessibility-header {
  padding: 1rem 1rem 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.accessibility-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.accessibility-description {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

/* Options */
.accessibility-options {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.accessibility-option {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accessibility-option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #111827);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.accessibility-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary, #0066cc);
  cursor: pointer;
}

.accessibility-checkbox-label {
  cursor: pointer;
}

.accessibility-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: var(--color-input-bg, #ffffff);
  color: var(--color-text, #111827);
  cursor: pointer;
}

.accessibility-select:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-focus, #0066cc);
}

.accessibility-option-description {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

/* Footer */
.accessibility-footer {
  padding: 0.75rem 1rem 1rem 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  justify-content: flex-end;
}

/* Text size support */
.text-size-small .accessibility-toggle {
  font-size: 0.8125rem;
}

.text-size-small .accessibility-title {
  font-size: 1rem;
}

.text-size-small .accessibility-description {
  font-size: 0.8125rem;
}

.text-size-large .accessibility-toggle {
  font-size: 0.9375rem;
}

.text-size-large .accessibility-title {
  font-size: 1.25rem;
}

.text-size-large .accessibility-description {
  font-size: 0.9375rem;
}

.text-size-extra-large .accessibility-toggle {
  font-size: 1rem;
}

.text-size-extra-large .accessibility-title {
  font-size: 1.375rem;
}

.text-size-extra-large .accessibility-description {
  font-size: 1rem;
}

/* High contrast mode */
.high-contrast .accessibility-toggle {
  border: 2px solid var(--color-text, #000000);
  background-color: var(--color-bg, #ffffff);
}

.high-contrast .accessibility-content {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .accessibility-header {
  border-bottom-color: var(--color-text, #000000);
}

.high-contrast .accessibility-footer {
  border-top-color: var(--color-text, #000000);
}

.high-contrast .accessibility-select {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .accessibility-select:focus {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
  border-color: var(--color-focus, #000000);
}

/* Reduced motion support */
.reduced-motion .accessibility-content {
  animation: none;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .accessibility-content {
    width: 18rem;
    right: -1rem;
  }
}
</style>

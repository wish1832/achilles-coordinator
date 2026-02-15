<template>
  <div class="settings-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Main content -->
    <main id="main-content" class="settings-main">
      <div class="settings-container">
        <!-- Page header -->
        <div class="settings-header">
          <h1 class="settings-title">Settings</h1>
          <p class="settings-subtitle">Manage your account and preferences</p>
        </div>

        <!-- Settings sections -->
        <div class="settings-sections">
          <!-- Account section -->
          <section class="settings-section" aria-labelledby="account-heading">
            <h2 id="account-heading" class="settings-section__title">Account</h2>
            <div class="settings-section__content">
              <div class="settings-field">
                <label class="settings-field__label">Display Name</label>
                <p class="settings-field__value">{{ displayName }}</p>
              </div>
              <div class="settings-field">
                <label class="settings-field__label">Email</label>
                <p class="settings-field__value">{{ userEmail }}</p>
              </div>
              <div class="settings-field">
                <label class="settings-field__label">Role</label>
                <p class="settings-field__value settings-field__value--capitalize">{{ userRole }}</p>
              </div>
            </div>
          </section>

          <!-- Accessibility section -->
          <section class="settings-section" aria-labelledby="accessibility-heading">
            <h2 id="accessibility-heading" class="settings-section__title">Accessibility</h2>
            <p class="settings-section__description">
              Customize your experience with these accessibility options
            </p>
            <div class="settings-section__content">
              <!-- High contrast toggle -->
              <div class="settings-option">
                <div class="settings-option__header">
                  <label class="settings-option__label" for="high-contrast-toggle">
                    High Contrast Mode
                  </label>
                  <p class="settings-option__description">
                    Increases contrast for better visibility
                  </p>
                </div>
                <div class="settings-option__control">
                  <button
                    id="high-contrast-toggle"
                    type="button"
                    role="switch"
                    :aria-checked="accessibilityStore.isHighContrast"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--active': accessibilityStore.isHighContrast }"
                    @click="accessibilityStore.toggleHighContrast"
                  >
                    <span class="toggle-switch__slider" aria-hidden="true"></span>
                    <span class="sr-only">
                      {{ accessibilityStore.isHighContrast ? 'Disable' : 'Enable' }} high contrast mode
                    </span>
                  </button>
                </div>
              </div>

              <!-- Text size selector -->
              <div class="settings-option">
                <div class="settings-option__header">
                  <label class="settings-option__label" for="text-size-select">
                    Text Size
                  </label>
                  <p class="settings-option__description">
                    Adjust the size of text throughout the application
                  </p>
                </div>
                <div class="settings-option__control">
                  <select
                    id="text-size-select"
                    :value="accessibilityStore.textSize"
                    class="settings-select"
                    @change="handleTextSizeChange"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium (Default)</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
              </div>

              <!-- Reduced motion toggle -->
              <div class="settings-option">
                <div class="settings-option__header">
                  <label class="settings-option__label" for="reduced-motion-toggle">
                    Reduce Motion
                  </label>
                  <p class="settings-option__description">
                    Minimizes animations and transitions
                  </p>
                </div>
                <div class="settings-option__control">
                  <button
                    id="reduced-motion-toggle"
                    type="button"
                    role="switch"
                    :aria-checked="accessibilityStore.isReducedMotion"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--active': accessibilityStore.isReducedMotion }"
                    @click="accessibilityStore.toggleReducedMotion"
                  >
                    <span class="toggle-switch__slider" aria-hidden="true"></span>
                    <span class="sr-only">
                      {{ accessibilityStore.isReducedMotion ? 'Disable' : 'Enable' }} reduced motion
                    </span>
                  </button>
                </div>
              </div>

              <!-- Focus indicators toggle -->
              <div class="settings-option">
                <div class="settings-option__header">
                  <label class="settings-option__label" for="focus-visible-toggle">
                    Enhanced Focus Indicators
                  </label>
                  <p class="settings-option__description">
                    Makes focus indicators more prominent for keyboard navigation
                  </p>
                </div>
                <div class="settings-option__control">
                  <button
                    id="focus-visible-toggle"
                    type="button"
                    role="switch"
                    :aria-checked="accessibilityStore.isFocusVisible"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--active': accessibilityStore.isFocusVisible }"
                    @click="accessibilityStore.toggleFocusVisible"
                  >
                    <span class="toggle-switch__slider" aria-hidden="true"></span>
                    <span class="sr-only">
                      {{ accessibilityStore.isFocusVisible ? 'Disable' : 'Enable' }} enhanced focus indicators
                    </span>
                  </button>
                </div>
              </div>

              <!-- Reset button -->
              <div class="settings-option settings-option--action">
                <AchillesButton
                  variant="secondary"
                  size="medium"
                  @click="accessibilityStore.resetSettings"
                >
                  Reset to Defaults
                </AchillesButton>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAccessibilityStore } from '@/stores/accessibility'
import AchillesButton from '@/components/ui/AchillesButton.vue'

// Stores
const authStore = useAuthStore()
const accessibilityStore = useAccessibilityStore()

// Computed properties for user information
const displayName = computed(() => authStore.userDisplayName || 'Not set')
const userEmail = computed(() => authStore.currentUser?.email || 'Not available')
const userRole = computed(() => authStore.userRole || 'Not set')

// Handle text size change from select dropdown
function handleTextSizeChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  const value = target.value as 'small' | 'medium' | 'large' | 'extra-large'
  accessibilityStore.setTextSize(value)
}
</script>

<style scoped>
/* Main layout */
.settings-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Main content */
.settings-main {
  padding: 2rem 0;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Page header */
.settings-header {
  margin-bottom: 2rem;
}

.settings-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.settings-subtitle {
  font-size: 1rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.5;
}

/* Settings sections */
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-section {
  background-color: var(--color-card-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  padding: 1.5rem;
}

.settings-section__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.settings-section__description {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

.settings-section__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Account fields (read-only display) */
.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.settings-field:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.settings-field__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-field__value {
  font-size: 1rem;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.5;
}

.settings-field__value--capitalize {
  text-transform: capitalize;
}

/* Settings options (toggles, selects) */
.settings-option {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.settings-option:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.settings-option--action {
  justify-content: flex-start;
  padding-top: 1.5rem;
}

.settings-option__header {
  flex: 1;
}

.settings-option__label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text, #111827);
  display: block;
  margin-bottom: 0.25rem;
  cursor: pointer;
}

.settings-option__description {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.settings-option__control {
  flex-shrink: 0;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  background-color: var(--color-border, #e5e7eb);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  padding: 0;
}

.toggle-switch--active {
  background-color: var(--color-primary, #0066cc);
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

.toggle-switch__slider {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s ease-in-out;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.1));
}

.toggle-switch--active .toggle-switch__slider {
  transform: translateX(1.25rem);
}

/* Select dropdown */
.settings-select {
  min-width: 10rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--color-text, #111827);
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
}

.settings-select:hover {
  border-color: var(--color-primary, #0066cc);
}

.settings-select:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-primary, #0066cc);
}

/* Text size support */
.text-size-small .settings-title {
  font-size: 1.75rem;
}

.text-size-large .settings-title {
  font-size: 2.25rem;
}

.text-size-extra-large .settings-title {
  font-size: 2.5rem;
}

/* High contrast mode */
.high-contrast .settings-section {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .settings-field {
  border-bottom-color: var(--color-text, #000000);
}

.high-contrast .settings-option {
  border-bottom-color: var(--color-text, #000000);
}

.high-contrast .toggle-switch {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .toggle-switch:focus-visible {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

.high-contrast .settings-select {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .settings-select:focus-visible {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

/* Reduced motion support */
.reduced-motion .toggle-switch,
.reduced-motion .toggle-switch__slider,
.reduced-motion .settings-select {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .settings-main {
    padding: 1.5rem 0;
  }

  .settings-container {
    padding: 0 0.75rem;
  }

  .settings-title {
    font-size: 1.75rem;
  }

  .settings-section {
    padding: 1.25rem;
  }

  .settings-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .settings-option__control {
    width: 100%;
  }

  .settings-select {
    width: 100%;
  }
}
</style>

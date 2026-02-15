<script setup lang="ts">
import { useAccessibilityStore } from '@/stores/accessibility'

// Initialize stores
const accessibilityStore = useAccessibilityStore()

// Note: Authentication is initialized in main.ts before router navigation
// to ensure auth state is loaded before routing decisions are made
</script>

<template>
  <div id="app" :class="accessibilityStore.accessibilityClasses" class="app">
    <!-- KeepAlive caches component instances so they aren't destroyed on navigation -->
    <!-- This allows components to use onActivated to refresh data when revisited -->
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<style>
/* Global CSS variables for theming */
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-primary-hover: #0052a3;
  --color-primary-text: #ffffff;

  --color-secondary: #f8f9fa;
  --color-secondary-hover: #e9ecef;
  --color-secondary-text: #212529;

  --color-danger: #dc3545;
  --color-danger-hover: #c82333;
  --color-danger-text: #ffffff;

  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-info: #17a2b8;

  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-text-light: #9ca3af;

  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;

  --color-border: #e5e7eb;
  --color-border-light: #f3f4f6;

  --color-focus: #0066cc;
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --color-error-border: #fecaca;

  /* Card and modal colors */
  --color-card-bg: #ffffff;
  --color-card-border: #e5e7eb;
  --color-card-filled: #f8f9fa;

  --color-modal-bg: #ffffff;
  --color-overlay: rgba(0, 0, 0, 0.5);

  /* Input colors */
  --color-input-bg: #ffffff;
  --color-input-border: #d1d5db;
  --color-input-disabled-bg: #f9fafb;
  --color-input-disabled-text: #9ca3af;
  --color-input-filled-bg: #f3f4f6;

  /* Link colors */
  --color-link: #0066cc;
  --color-link-hover: #0052a3;

  /* Ghost button colors */
  --color-ghost-hover: #f8f9fa;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Background gradients */
  --color-bg-gradient-start: #667eea;
  --color-bg-gradient-end: #764ba2;
}

/* High contrast mode */
.high-contrast {
  --color-primary: #000000;
  --color-primary-hover: #333333;
  --color-primary-text: #ffffff;

  --color-secondary: #ffffff;
  --color-secondary-hover: #f0f0f0;
  --color-secondary-text: #000000;

  --color-text: #000000;
  --color-text-muted: #333333;
  --color-text-light: #666666;

  --color-bg: #ffffff;
  --color-bg-secondary: #f8f8f8;
  --color-bg-tertiary: #f0f0f0;

  --color-border: #000000;
  --color-border-light: #333333;

  --color-focus: #000000;
  --color-error: #000000;
  --color-error-bg: #ffffff;
  --color-error-border: #000000;

  --color-card-bg: #ffffff;
  --color-card-border: #000000;
  --color-card-filled: #f8f8f8;

  --color-modal-bg: #ffffff;
  --color-overlay: rgba(0, 0, 0, 0.8);

  --color-input-bg: #ffffff;
  --color-input-border: #000000;
  --color-input-disabled-bg: #f0f0f0;
  --color-input-disabled-text: #666666;
  --color-input-filled-bg: #f8f8f8;

  --color-link: #000000;
  --color-link-hover: #333333;

  --color-ghost-hover: #f0f0f0;
}

/* Text size support */
.text-size-small {
  font-size: 0.875rem;
}

.text-size-medium {
  font-size: 1rem;
}

.text-size-large {
  font-size: 1.125rem;
}

.text-size-extra-large {
  font-size: 1.25rem;
}

/* Base app styles */
.app {
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
}

/* Reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  background-color: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Focus styles for all interactive elements */
*:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* High contrast focus styles */
.high-contrast *:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

/* Reduced motion support */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* Skip link styles */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-focus);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>

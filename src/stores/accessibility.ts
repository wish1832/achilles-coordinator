import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AccessibilitySettings } from '@/types'

/**
 * Accessibility store using Pinia
 * Manages accessibility settings like high contrast mode, text sizing, and other preferences
 * Persists settings to localStorage for user convenience
 */
export const useAccessibilityStore = defineStore('accessibility', () => {
  // Default accessibility settings
  const defaultSettings: AccessibilitySettings = {
    highContrast: false,
    textSize: 'medium',
    reducedMotion: false,
    focusVisible: true,
  }

  // State - initialize from localStorage or use defaults
  const initialSettings = (() => {
    try {
      const stored = localStorage.getItem('achilles-accessibility-settings')
      return stored ? ({ ...defaultSettings, ...JSON.parse(stored) } as AccessibilitySettings) : defaultSettings
    } catch {
      return defaultSettings
    }
  })()

  const settings = ref<AccessibilitySettings>(initialSettings)

  // Getters (computed properties)
  const isHighContrast = computed(() => settings.value.highContrast)
  const textSize = computed(() => settings.value.textSize)
  const isReducedMotion = computed(() => settings.value.reducedMotion)
  const isFocusVisible = computed(() => settings.value.focusVisible)

  /**
   * Get CSS class names for current accessibility settings
   * These classes can be applied to the root element or specific components
   */
  const accessibilityClasses = computed(() => {
    const classes = []

    if (settings.value.highContrast) {
      classes.push('high-contrast')
    }

    classes.push(`text-size-${settings.value.textSize}`)

    if (settings.value.reducedMotion) {
      classes.push('reduced-motion')
    }

    if (settings.value.focusVisible) {
      classes.push('focus-visible')
    }

    return classes.join(' ')
  })

  /**
   * Update accessibility settings
   * @param newSettings - Partial settings to update
   */
  function updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    settings.value = { ...settings.value, ...newSettings }

    // Persist to localStorage
    try {
      localStorage.setItem('achilles-accessibility-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save accessibility settings:', error)
    }
    // Apply classes immediately so UI updates without reload
    applyAccessibilityClasses()
  }

  /**
   * Toggle high contrast mode
   */
  function toggleHighContrast(): void {
    updateSettings({ highContrast: !settings.value.highContrast })
  }

  /**
   * Set text size
   * @param size - Text size option
   */
  function setTextSize(size: AccessibilitySettings['textSize']): void {
    updateSettings({ textSize: size })
  }

  /**
   * Toggle reduced motion preference
   */
  function toggleReducedMotion(): void {
    updateSettings({ reducedMotion: !settings.value.reducedMotion })
  }

  /**
   * Toggle focus visible indicators
   */
  function toggleFocusVisible(): void {
    updateSettings({ focusVisible: !settings.value.focusVisible })
  }

  /**
   * Reset all settings to defaults
   */
  function resetSettings(): void {
    settings.value = { ...defaultSettings }

    try {
      localStorage.removeItem('achilles-accessibility-settings')
    } catch (error) {
      console.error('Failed to reset accessibility settings:', error)
    }
    applyAccessibilityClasses()
  }

  /**
   * Apply accessibility-related classes to the document element
   * Uses the current settings to add/remove classes (high-contrast, text-size-*, reduced-motion, focus-visible)
   */
  function applyAccessibilityClasses(): void {
    if (typeof window === 'undefined' || !document?.documentElement) return

    const root = document.documentElement

    try {
      // High contrast
      if (settings.value.highContrast) root.classList.add('high-contrast')
      else root.classList.remove('high-contrast')

      // Text size classes: ensure only the current text-size-* is present
      const sizePrefix = 'text-size-'
      Array.from(root.classList)
        .filter((c) => c.startsWith(sizePrefix))
        .forEach((c) => root.classList.remove(c))
      root.classList.add(`${sizePrefix}${settings.value.textSize}`)

      // Reduced motion
      if (settings.value.reducedMotion) root.classList.add('reduced-motion')
      else root.classList.remove('reduced-motion')

      // Focus visible indicators
      if (settings.value.focusVisible) root.classList.add('focus-visible')
      else root.classList.remove('focus-visible')
    } catch (e) {
      // non-fatal
      console.warn('Failed to apply accessibility classes:', e)
    }
  }

  /**
   * Initialize accessibility on app/route mount
   * - Applies classes based on current settings
   * - Ensures an ARIA live region exists for announcements
   */
  function initializeAuth(): void {
    if (typeof window === 'undefined') return

    applyAccessibilityClasses()

    // Ensure an announcer element for a11y notifications
    try {
      const id = 'a11y-announcer'
      let announcer = document.getElementById(id)
      if (!announcer) {
        announcer = document.createElement('div')
        announcer.id = id
        announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
        announcer.style.width = '1px'
        announcer.style.height = '1px'
        announcer.style.margin = '-1px'
        announcer.style.border = '0'
        announcer.style.padding = '0'
        announcer.style.overflow = 'hidden'
        announcer.style.clip = 'rect(0 0 0 0)'
        document.body.appendChild(announcer)
      }
    } catch (e) {
      // non-fatal
      console.warn('Failed to initialize accessibility announcer:', e)
    }
  }

  /**
   * Announce a message via an ARIA live region
   * @param message - The message to announce
   * @param polite - 'polite' or 'assertive' politeness level
   */
  function announce(message: string, polite: 'polite' | 'assertive' = 'polite'): void {
    if (typeof window === 'undefined') return

    try {
      const id = 'a11y-announcer'
      let announcer = document.getElementById(id)
      if (!announcer) {
        // Create minimal announcer if initialize wasn't called
        announcer = document.createElement('div')
        announcer.id = id
        announcer.setAttribute('aria-live', polite)
        announcer.setAttribute('aria-atomic', 'true')
        announcer.style.position = 'absolute'
        announcer.style.width = '1px'
        announcer.style.height = '1px'
        announcer.style.margin = '-1px'
        announcer.style.border = '0'
        announcer.style.padding = '0'
        announcer.style.overflow = 'hidden'
        announcer.style.clip = 'rect(0 0 0 0)'
        document.body.appendChild(announcer)
      } else {
        announcer.setAttribute('aria-live', polite)
      }

      // Update content to trigger announcement. Clear after a short timeout to allow re-announcements.
      announcer.textContent = message
      setTimeout(() => {
        // Clear only if it hasn't been replaced
        if (announcer && announcer.textContent === message) announcer.textContent = ''
      }, 700)
    } catch (e) {
      // non-fatal
      console.warn('Failed to announce message:', e)
    }
  }


  /**
   * Get text size multiplier for CSS calculations
   * @returns Multiplier value for font-size calculations
   */
  function getTextSizeMultiplier(): number {
    const multipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125,
      'extra-large': 1.25,
    }
    return multipliers[settings.value.textSize]
  }

  /**
   * Check if user prefers reduced motion
   * Useful for conditional animations and transitions
   * @returns True if user prefers reduced motion
   */
  function prefersReducedMotion(): boolean {
    return (
      settings.value.reducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    )
  }

  return {
    // State
    settings,

    // Getters
    isHighContrast,
    textSize,
    isReducedMotion,
    isFocusVisible,
    accessibilityClasses,

    // Actions
    updateSettings,
    toggleHighContrast,
    setTextSize,
    toggleReducedMotion,
    toggleFocusVisible,
    resetSettings,
    getTextSizeMultiplier,
    prefersReducedMotion,
    // Initialization and utilities
    initializeAuth,
    announce,
  }
})

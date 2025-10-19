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
  const settings = ref<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem('achilles-accessibility-settings')
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

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
  }
})

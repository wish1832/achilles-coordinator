import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDataRepository } from '@/composables/useRepositories'
import type { Location, LoadingState } from '@/types'

/**
 * Location store using Pinia
 * Manages location state and provides methods for CRUD operations
 * Locations are organization-scoped - each location belongs to one organization
 */
export const useLocationStore = defineStore('location', () => {
  // Get repository instance via dependency injection
  // This allows for easy testing with mock implementations
  const dataRepository = useDataRepository()

  // State
  // All locations currently loaded in memory
  const locations = ref<Location[]>([])
  // The currently selected/active location (if any)
  const currentLocation = ref<Location | null>(null)
  // Loading state for async operations
  const loading = ref<LoadingState>('idle')
  // Error message for the last failed operation
  const error = ref<string | null>(null)
  // Sequence number to handle race conditions in async operations
  const loadSequence = ref(0)
  // The organization ID for which locations were last loaded (if any)
  const loadedForOrganizationId = ref<string | null>(null)

  // Getters (computed properties and functions)

  /**
   * Get location by ID from the loaded locations
   * @param id - Location ID to find
   * @returns Location or undefined if not found
   */
  function getLocationById(id: string): Location | undefined {
    return locations.value.find((loc) => loc.id === id)
  }

  /**
   * Get all locations for a specific organization from loaded locations
   * @param organizationId - Organization ID to filter by
   * @returns Array of locations for the organization
   */
  function getLocationsByOrganization(organizationId: string): Location[] {
    return locations.value.filter((loc) => loc.organizationId === organizationId)
  }

  /**
   * Computed property: Get locations sorted by name
   */
  const locationsSortedByName = computed(() => {
    return [...locations.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Actions

  /**
   * Load all locations for a specific organization from Firestore
   * Sets locations state with all locations for the organization, ordered by name
   * @param organizationId - Organization ID to load locations for
   */
  async function loadLocationsForOrganization(organizationId: string): Promise<void> {
    // Increment sequence to detect race conditions
    const flight = ++loadSequence.value
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch locations from Firestore via repository
      const locs = await dataRepository.getLocationsForOrganization(organizationId)

      // Check if this is still the latest request (race condition check)
      if (flight !== loadSequence.value) return

      locations.value = locs
      loadedForOrganizationId.value = organizationId

      // Clear currentLocation if it's no longer in the loaded locations
      if (
        currentLocation.value &&
        !locations.value.find((loc) => loc.id === currentLocation.value?.id)
      ) {
        currentLocation.value = null
      }

      loading.value = 'success'
    } catch (err) {
      // Only update state if this is still the latest request
      if (flight !== loadSequence.value) return
      error.value = err instanceof Error ? err.message : 'Failed to load locations'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load a single location by ID
   * @param id - Location ID to load
   */
  async function loadLocation(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch location from Firestore via repository
      const loc = await dataRepository.getLocation(id)

      if (!loc) {
        throw new Error(`Location with id ${id} not found`)
      }

      currentLocation.value = loc

      // Update the location in the locations array if it exists
      const index = locations.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        locations.value[index] = loc
      } else {
        // Add to array if not already present
        locations.value.push(loc)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load location'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new location
   * @param locationData - Location data (without id)
   * @returns Promise resolving to the new location ID
   */
  async function createLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    try {
      loading.value = 'loading'
      error.value = null

      // Create location in Firestore via repository
      const id = await dataRepository.createLocation(locationData)

      // Reload locations for the organization to include the new one
      if (locationData.organizationId) {
        await loadLocationsForOrganization(locationData.organizationId)
      }

      loading.value = 'success'
      return id
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create location'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Update an existing location
   * @param id - Location ID to update
   * @param updates - Partial location data to update
   */
  async function updateLocation(
    id: string,
    updates: Partial<Omit<Location, 'id'>>,
  ): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Update location in Firestore via repository
      await dataRepository.updateLocation(id, updates)

      // Update local state
      const index = locations.value.findIndex((loc) => loc.id === id)
      if (index !== -1 && locations.value[index]) {
        Object.assign(locations.value[index], updates)
      }

      // Update currentLocation if it's the one being updated
      if (currentLocation.value?.id === id && currentLocation.value) {
        Object.assign(currentLocation.value, updates)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update location'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Delete a location
   * @param id - Location ID to delete
   */
  async function deleteLocation(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Delete location from Firestore via repository
      await dataRepository.deleteLocation(id)

      // Remove from local state
      locations.value = locations.value.filter((loc) => loc.id !== id)

      // Clear currentLocation if it's the one being deleted
      if (currentLocation.value?.id === id) {
        currentLocation.value = null
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete location'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Set the current location
   * Used when navigating to location-specific views
   * @param location - Location to set as current
   */
  function setCurrentLocation(location: Location | null): void {
    currentLocation.value = location
  }

  /**
   * Clear any error messages
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset the store to its initial state
   */
  function reset(): void {
    locations.value = []
    currentLocation.value = null
    loading.value = 'idle'
    error.value = null
    loadedForOrganizationId.value = null
  }

  return {
    // State
    locations,
    currentLocation,
    loading,
    error,
    loadedForOrganizationId,

    // Getters
    getLocationById,
    getLocationsByOrganization,
    locationsSortedByName,

    // Actions
    loadLocationsForOrganization,
    loadLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    setCurrentLocation,
    clearError,
    reset,
  }
})

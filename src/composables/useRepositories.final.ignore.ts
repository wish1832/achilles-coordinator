import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import {
  firebaseAuthRepository,
  firebaseDataRepository,
} from '@/repositories/firebase'

/**
 * Composable for repository dependency injection
 * This provides the correct repository implementation based on the environment
 *
 * Environment selection:
 * - Production: Uses real Firebase SDK implementations
 * - Unit tests (MODE === 'test'): Uses in-memory mock implementations
 * - Integration tests (VITE_USE_EMULATOR === 'true'): Uses Firebase emulator implementations
 *
 * This pattern allows for:
 * 1. Fast unit tests with no Firebase dependency
 * 2. Realistic integration tests with Firebase emulators
 * 3. Easy swapping of data sources without changing business logic
 */

/**
 * Get the authentication repository for the current environment
 * @returns IAuthRepository implementation (Firebase, Mock, or Emulator)
 */
export function useAuthRepository(): IAuthRepository {
  // Check if we're running in test mode
  if (import.meta.env.MODE === 'test') {
    // TODO: Return mock repository when implemented
    // return mockAuthRepository
    throw new Error('Mock repository not yet implemented. Please implement MockAuthRepository.')
  }

  // Check if we're using Firebase emulators
  if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    // TODO: Return emulator repository when implemented
    // return emulatorAuthRepository
    throw new Error(
      'Emulator repository not yet implemented. Please implement EmulatorAuthRepository.',
    )
  }

  // Default to production Firebase implementation
  return firebaseAuthRepository
}

/**
 * Get the data repository for the current environment
 * @returns IDataRepository implementation (Firebase, Mock, or Emulator)
 */
export function useDataRepository(): IDataRepository {
  // Check if we're running in test mode
  if (import.meta.env.MODE === 'test') {
    // TODO: Return mock repository when implemented
    // return mockDataRepository
    throw new Error('Mock repository not yet implemented. Please implement MockDataRepository.')
  }

  // Check if we're using Firebase emulators
  if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    // TODO: Return emulator repository when implemented
    // return emulatorDataRepository
    throw new Error(
      'Emulator repository not yet implemented. Please implement EmulatorDataRepository.',
    )
  }

  // Default to production Firebase implementation
  return firebaseDataRepository
}

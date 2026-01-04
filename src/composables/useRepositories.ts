import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import {
  firebaseAuthRepository,
  firebaseDataRepository,
} from '@/repositories/firebase'
import { mockAuthRepository, mockDataRepository } from '@/repositories/mock'

/**
 * Composable for repository dependency injection
 * This provides the correct repository implementation based on the environment
 *
 * Environment selection:
 * - Production: Uses real Firebase SDK implementations
 * - Unit tests (MODE === 'test'): Uses in-memory mock implementations
 * - Integration tests (VITE_FIREBASE_USE_EMULATOR === 'true'): Uses Firebase emulator implementations
 *
 * This pattern allows for:
 * 1. Fast unit tests with no Firebase dependency
 * 2. Realistic integration tests with Firebase emulators
 * 3. Easy swapping of data sources without changing business logic
 */

type RepoBackend = 'firebase' | 'mock'

function getBackend(): RepoBackend {
  // hard rule: tests always use mock
  if (import.meta.env.MODE === 'test') return 'mock'

  // otherwise read the explicit selector (with a safe default)
  const v = (import.meta.env.VITE_REPO_BACKEND ?? 'firebase') as RepoBackend
  if (v !== 'mock' && v !== 'firebase') return 'firebase'
  return v
}

function useEmulator(): boolean {
  return import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true'
}

/**
 * Get the authentication repository for the current environment
 * @returns IAuthRepository implementation (Firebase, Mock, or Emulator)
 */
export function useAuthRepository(): IAuthRepository {
  const backend = getBackend()
  if (backend === 'mock') return mockAuthRepository

  if (useEmulator()) {
    // if you don’t have emulator repos, you can either:
    // A) still use firebase repo but connect SDK to emulator elsewhere, OR
    // B) return emulatorAuthRepository when implemented
    // For now, I’d avoid throwing if you can run with emulator-connected SDK.
  }

  return firebaseAuthRepository
}

/**
 * Get the data repository for the current environment
 * @returns IDataRepository implementation (Firebase, Mock, or Emulator)
 */
export function useDataRepository(): IDataRepository {
  const backend = getBackend()

  if (backend === 'mock') return mockDataRepository

  if (useEmulator()) {
    // same note as above
  }

  return firebaseDataRepository
}

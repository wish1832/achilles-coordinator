import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import type { IOrganizationRepository } from '@/repositories/interfaces/IOrganizationRepository'
import type { IRunRepository } from '@/repositories/interfaces/IRunRepository'
import type { ISignUpRepository } from '@/repositories/interfaces/ISignUpRepository'
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import {
  createLazyAuthRepository,
  createLazyDataRepository,
  createLazyRepository,
} from './internal/lazyRepository'

/**
 * Repository dependency injection (DI) entry point.
 *
 * Keep this file focused on "which implementation should I use?"
 * - Mock for tests and local development (fast, no Firebase SDK).
 * - Firebase for production (real SDK).
 * - Emulator wiring can be added later without changing call sites.
 *
 * The lazy-loading details live in `src/composables/internal/lazyRepository.ts`
 * so the DI story is easy to follow when onboarding.
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

let cachedFirebaseAuthRepository: Promise<IAuthRepository> | null = null
let cachedFirebaseDataRepository: Promise<IDataRepository> | null = null
let cachedFirebaseOrganizationRepository: Promise<IOrganizationRepository> | null = null
let cachedFirebaseRunRepository: Promise<IRunRepository> | null = null
let cachedFirebaseSignUpRepository: Promise<ISignUpRepository> | null = null
let cachedFirebaseUserRepository: Promise<IUserRepository> | null = null
let cachedMockAuthRepository: Promise<IAuthRepository> | null = null
let cachedMockDataRepository: Promise<IDataRepository> | null = null
let cachedMockOrganizationRepository: Promise<IOrganizationRepository> | null = null
let cachedMockRunRepository: Promise<IRunRepository> | null = null
let cachedMockSignUpRepository: Promise<ISignUpRepository> | null = null
let cachedMockUserRepository: Promise<IUserRepository> | null = null

function loadFirebaseAuthRepository(): Promise<IAuthRepository> {
  if (!cachedFirebaseAuthRepository) {
    cachedFirebaseAuthRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseAuthRepository,
    )
  }

  return cachedFirebaseAuthRepository
}

function loadFirebaseDataRepository(): Promise<IDataRepository> {
  if (!cachedFirebaseDataRepository) {
    cachedFirebaseDataRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseDataRepository,
    )
  }

  return cachedFirebaseDataRepository
}

function loadFirebaseOrganizationRepository(): Promise<IOrganizationRepository> {
  if (!cachedFirebaseOrganizationRepository) {
    cachedFirebaseOrganizationRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseOrganizationRepository,
    )
  }

  return cachedFirebaseOrganizationRepository
}

function loadFirebaseRunRepository(): Promise<IRunRepository> {
  if (!cachedFirebaseRunRepository) {
    cachedFirebaseRunRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseRunRepository,
    )
  }

  return cachedFirebaseRunRepository
}

function loadFirebaseSignUpRepository(): Promise<ISignUpRepository> {
  if (!cachedFirebaseSignUpRepository) {
    cachedFirebaseSignUpRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseSignUpRepository,
    )
  }

  return cachedFirebaseSignUpRepository
}

function loadFirebaseUserRepository(): Promise<IUserRepository> {
  if (!cachedFirebaseUserRepository) {
    cachedFirebaseUserRepository = import('@/repositories/firebase').then(
      (module) => module.firebaseUserRepository,
    )
  }

  return cachedFirebaseUserRepository
}

function loadMockAuthRepository(): Promise<IAuthRepository> {
  if (!cachedMockAuthRepository) {
    cachedMockAuthRepository = import('@/repositories/mock').then(
      (module) => module.mockAuthRepository,
    )
  }

  return cachedMockAuthRepository
}

function loadMockDataRepository(): Promise<IDataRepository> {
  if (!cachedMockDataRepository) {
    cachedMockDataRepository = import('@/repositories/mock').then(
      (module) => module.mockDataRepository,
    )
  }

  return cachedMockDataRepository
}

function loadMockOrganizationRepository(): Promise<IOrganizationRepository> {
  if (!cachedMockOrganizationRepository) {
    cachedMockOrganizationRepository = import('@/repositories/mock').then(
      (module) => module.mockOrganizationRepository,
    )
  }

  return cachedMockOrganizationRepository
}

function loadMockRunRepository(): Promise<IRunRepository> {
  if (!cachedMockRunRepository) {
    cachedMockRunRepository = import('@/repositories/mock').then(
      (module) => module.mockRunRepository,
    )
  }

  return cachedMockRunRepository
}

function loadMockSignUpRepository(): Promise<ISignUpRepository> {
  if (!cachedMockSignUpRepository) {
    cachedMockSignUpRepository = import('@/repositories/mock').then(
      (module) => module.mockSignUpRepository,
    )
  }

  return cachedMockSignUpRepository
}

function loadMockUserRepository(): Promise<IUserRepository> {
  if (!cachedMockUserRepository) {
    cachedMockUserRepository = import('@/repositories/mock').then(
      (module) => module.mockUserRepository,
    )
  }

  return cachedMockUserRepository
}

/**
 * Get the authentication repository for the current environment
 * @returns IAuthRepository implementation (Firebase, Mock, or Emulator)
 */
export function useAuthRepository(): IAuthRepository {
  const backend = getBackend()
  if (backend === 'mock') return createLazyAuthRepository(loadMockAuthRepository)

  if (useEmulator()) {
    // if you don’t have emulator repos, you can either:
    // A) still use firebase repo but connect SDK to emulator elsewhere, OR
    // B) return emulatorAuthRepository when implemented
    // For now, I’d avoid throwing if you can run with emulator-connected SDK.
  }

  return createLazyAuthRepository(loadFirebaseAuthRepository)
}

/**
 * Get the user repository for the current environment
 * @returns IUserRepository implementation (Firebase or Mock)
 */
export function useUserRepository(): IUserRepository {
  const backend = getBackend()
  if (backend === 'mock') return createLazyRepository(loadMockUserRepository).repository

  if (useEmulator()) {
    // same note as above
  }

  return createLazyRepository(loadFirebaseUserRepository).repository
}

/**
 * Get the data repository for the current environment
 * @returns IDataRepository implementation (Firebase, Mock, or Emulator)
 */
export function useDataRepository(): IDataRepository {
  const backend = getBackend()

  if (backend === 'mock') return createLazyDataRepository(loadMockDataRepository)

  if (useEmulator()) {
    // same note as above
  }

  return createLazyDataRepository(loadFirebaseDataRepository)
}

/**
 * Get the run repository for the current environment
 * @returns IRunRepository implementation (Firebase, Mock, or Emulator)
 */
export function useRunRepository(): IRunRepository {
  const backend = getBackend()

  if (backend === 'mock') return createLazyRepository(loadMockRunRepository).repository

  if (useEmulator()) {
    // same note as above
  }

  return createLazyRepository(loadFirebaseRunRepository).repository
}

/**
 * Get the organization repository for the current environment
 * @returns IOrganizationRepository implementation (Firebase, Mock, or Emulator)
 */
export function useOrganizationRepository(): IOrganizationRepository {
  const backend = getBackend()

  if (backend === 'mock') {
    return createLazyRepository(loadMockOrganizationRepository).repository
  }

  if (useEmulator()) {
    // same note as above
  }

  return createLazyRepository(loadFirebaseOrganizationRepository).repository
}

/**
 * Get the sign-up repository for the current environment
 * @returns ISignUpRepository implementation (Firebase, Mock, or Emulator)
 */
export function useSignUpRepository(): ISignUpRepository {
  const backend = getBackend()

  if (backend === 'mock') {
    return createLazyRepository(loadMockSignUpRepository).repository
  }

  if (useEmulator()) {
    // same note as above
  }

  return createLazyRepository(loadFirebaseSignUpRepository).repository
}

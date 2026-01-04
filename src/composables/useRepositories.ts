import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'

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

type RepositoryLoader<T> = () => Promise<T>

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
let cachedFirebaseUserRepository: Promise<IUserRepository> | null = null
let cachedMockAuthRepository: Promise<IAuthRepository> | null = null
let cachedMockDataRepository: Promise<IDataRepository> | null = null
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

function loadMockUserRepository(): Promise<IUserRepository> {
  if (!cachedMockUserRepository) {
    cachedMockUserRepository = import('@/repositories/mock').then(
      (module) => module.mockUserRepository,
    )
  }

  return cachedMockUserRepository
}

function createLazyAuthRepository(loader: RepositoryLoader<IAuthRepository>): IAuthRepository {
  let resolvedRepository: IAuthRepository | null = null
  let loadingRepository: Promise<IAuthRepository> | null = null

  const getRepository = async (): Promise<IAuthRepository> => {
    if (resolvedRepository) return resolvedRepository
    if (!loadingRepository) {
      loadingRepository = loader().then((repository) => {
        resolvedRepository = repository
        return repository
      })
    }

    return loadingRepository
  }

  return {
    async signIn(email, password) {
      const repository = await getRepository()
      return repository.signIn(email, password)
    },
    async signOut() {
      const repository = await getRepository()
      return repository.signOut()
    },
    async createUser(email, password, displayName) {
      const repository = await getRepository()
      return repository.createUser(email, password, displayName)
    },
    getCurrentUser() {
      // Avoid forcing Firebase init just to read currentUser.
      // If the repo isn't ready yet, return null and trigger lazy load.
      if (resolvedRepository) return resolvedRepository.getCurrentUser()
      void getRepository()
      return null
    },
    onAuthStateChanged(callback) {
      let unsubscribe: (() => void) | null = null
      let cancelled = false

      void getRepository().then((repository) => {
        if (cancelled) return
        unsubscribe = repository.onAuthStateChanged(callback)
      })

      return () => {
        cancelled = true
        if (unsubscribe) unsubscribe()
      }
    },
  }
}

function createLazyUserRepository(loader: RepositoryLoader<IUserRepository>): IUserRepository {
  let resolvedRepository: IUserRepository | null = null
  let loadingRepository: Promise<IUserRepository> | null = null

  const getRepository = async (): Promise<IUserRepository> => {
    if (resolvedRepository) return resolvedRepository
    if (!loadingRepository) {
      loadingRepository = loader().then((repository) => {
        resolvedRepository = repository
        return repository
      })
    }

    return loadingRepository
  }

  return {
    async createUser(id, userData) {
      const repository = await getRepository()
      return repository.createUser(id, userData)
    },
    async updateUser(id, userData) {
      const repository = await getRepository()
      return repository.updateUser(id, userData)
    },
    async getUser(id) {
      const repository = await getRepository()
      return repository.getUser(id)
    },
    async getUsers() {
      const repository = await getRepository()
      return repository.getUsers()
    },
    async getUserByEmail(email) {
      const repository = await getRepository()
      return repository.getUserByEmail(email)
    },
  }
}

function createLazyDataRepository(loader: RepositoryLoader<IDataRepository>): IDataRepository {
  // Lazy import keeps Firebase from initializing when mock mode is selected.
  let resolvedRepository: IDataRepository | null = null
  let loadingRepository: Promise<IDataRepository> | null = null

  const getRepository = async (): Promise<IDataRepository> => {
    if (resolvedRepository) return resolvedRepository
    if (!loadingRepository) {
      loadingRepository = loader().then((repository) => {
        resolvedRepository = repository
        return repository
      })
    }

    return loadingRepository
  }

  return {
    async addDocument(collectionName, data) {
      const repository = await getRepository()
      return repository.addDocument(collectionName, data)
    },
    async updateDocument(collectionName, id, data) {
      const repository = await getRepository()
      return repository.updateDocument(collectionName, id, data)
    },
    async deleteDocument(collectionName, id) {
      const repository = await getRepository()
      return repository.deleteDocument(collectionName, id)
    },
    async getDocument(collectionName, id) {
      const repository = await getRepository()
      return repository.getDocument(collectionName, id)
    },
    async getDocuments(collectionName, constraints) {
      const repository = await getRepository()
      return repository.getDocuments(collectionName, constraints)
    },
    onCollectionChange(collectionName, callback, constraints) {
      let unsubscribe: (() => void) | null = null
      let cancelled = false

      void getRepository().then((repository) => {
        if (cancelled) return
        unsubscribe = repository.onCollectionChange(collectionName, callback, constraints)
      })

      return () => {
        cancelled = true
        if (unsubscribe) unsubscribe()
      }
    },
    async createUser(userData) {
      const repository = await getRepository()
      return repository.createUser(userData)
    },
    async updateUser(id, userData) {
      const repository = await getRepository()
      return repository.updateUser(id, userData)
    },
    async getUser(id) {
      const repository = await getRepository()
      return repository.getUser(id)
    },
    async getUsers() {
      const repository = await getRepository()
      return repository.getUsers()
    },
    async createRun(runData) {
      const repository = await getRepository()
      return repository.createRun(runData)
    },
    async updateRun(id, runData) {
      const repository = await getRepository()
      return repository.updateRun(id, runData)
    },
    async deleteRun(id) {
      const repository = await getRepository()
      return repository.deleteRun(id)
    },
    async getRun(id) {
      const repository = await getRepository()
      return repository.getRun(id)
    },
    async getRuns() {
      const repository = await getRepository()
      return repository.getRuns()
    },
    async getUpcomingRuns() {
      const repository = await getRepository()
      return repository.getUpcomingRuns()
    },
    async createSignUp(signUpData) {
      const repository = await getRepository()
      return repository.createSignUp(signUpData)
    },
    async updateSignUp(id, signUpData) {
      const repository = await getRepository()
      return repository.updateSignUp(id, signUpData)
    },
    async deleteSignUp(id) {
      const repository = await getRepository()
      return repository.deleteSignUp(id)
    },
    async getSignUpsForRun(runId) {
      const repository = await getRepository()
      return repository.getSignUpsForRun(runId)
    },
    async getUserSignUps(userId) {
      const repository = await getRepository()
      return repository.getUserSignUps(userId)
    },
    async createOrganization(organizationData) {
      const repository = await getRepository()
      return repository.createOrganization(organizationData)
    },
    async updateOrganization(id, organizationData) {
      const repository = await getRepository()
      return repository.updateOrganization(id, organizationData)
    },
    async deleteOrganization(id) {
      const repository = await getRepository()
      return repository.deleteOrganization(id)
    },
    async getOrganization(id) {
      const repository = await getRepository()
      return repository.getOrganization(id)
    },
    async getOrganizations() {
      const repository = await getRepository()
      return repository.getOrganizations()
    },
    async getUserOrganizations(userId) {
      const repository = await getRepository()
      return repository.getUserOrganizations(userId)
    },
    async getUserAdminOrganizations(userId) {
      const repository = await getRepository()
      return repository.getUserAdminOrganizations(userId)
    },
    async addOrganizationMember(organizationId, userId) {
      const repository = await getRepository()
      return repository.addOrganizationMember(organizationId, userId)
    },
    async removeOrganizationMember(organizationId, userId) {
      const repository = await getRepository()
      return repository.removeOrganizationMember(organizationId, userId)
    },
    async addOrganizationAdmin(organizationId, userId) {
      const repository = await getRepository()
      return repository.addOrganizationAdmin(organizationId, userId)
    },
    async removeOrganizationAdmin(organizationId, userId) {
      const repository = await getRepository()
      return repository.removeOrganizationAdmin(organizationId, userId)
    },
    async createLocation(locationData) {
      const repository = await getRepository()
      return repository.createLocation(locationData)
    },
    async updateLocation(id, locationData) {
      const repository = await getRepository()
      return repository.updateLocation(id, locationData)
    },
    async deleteLocation(id) {
      const repository = await getRepository()
      return repository.deleteLocation(id)
    },
    async getLocation(id) {
      const repository = await getRepository()
      return repository.getLocation(id)
    },
    async getLocationsForOrganization(organizationId) {
      const repository = await getRepository()
      return repository.getLocationsForOrganization(organizationId)
    },
  }
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
  if (backend === 'mock') return createLazyUserRepository(loadMockUserRepository)

  if (useEmulator()) {
    // same note as above
  }

  return createLazyUserRepository(loadFirebaseUserRepository)
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

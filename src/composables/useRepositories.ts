import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import { firebaseAuthRepository, firebaseDataRepository } from '@/repositories/firebase'
import { mockAuthRepository, mockDataRepository } from '@/repositories/mock'

/**
 * Repository wiring for the app.
 * Keep this explicit so the dependency swap is easy to follow.
 */
const useMockRepositories = import.meta.env.VITE_USE_MOCK === 'true'

const repositories: {
  auth: IAuthRepository
  data: IDataRepository
} = {
  auth: useMockRepositories ? mockAuthRepository : firebaseAuthRepository,
  data: useMockRepositories ? mockDataRepository : firebaseDataRepository,
}

// tests can use this to swap out repositories as needed by overriding before stores are inited
export function setRepositories(next: Partial<typeof repositories>) {
  Object.assign(repositories, next)
}

/**
 * Get the authentication repository for the current wiring.
 */
export function useAuthRepository(): IAuthRepository {
  return repositories.auth
}

/**
 * Get the data repository for the current wiring.
 */
export function useDataRepository(): IDataRepository {
  return repositories.data
}

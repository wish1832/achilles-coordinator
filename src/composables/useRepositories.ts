import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import { mockAuthRepository, mockDataRepository } from '@/repositories/mock'

/**
 * Repository wiring for the app.
 * Keep this explicit so the dependency swap is easy to follow.
 *
 * NOTE: We intentionally hardcode mock repos here as a learning exercise.
 * When ready, wire in Firebase or a test/emulator repo explicitly.
 * The saved template in `src/composables/useRepositories.final.ignore.ts` shows
 * a fuller environment-based setup. Longer term, this could move to
 * provide/inject or a Pinia plugin once the basics are clear.
 *
 * Inversion of control: components/stores should depend on repository interfaces,
 * not concrete data sources. This keeps responsibilities separate (SRP) and
 * makes swapping data implementations low-friction.
 */
const repositories: {
  auth: IAuthRepository
  data: IDataRepository
} = {
  auth: mockAuthRepository,
  data: mockDataRepository,
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

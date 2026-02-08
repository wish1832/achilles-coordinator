import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'

type RepositoryLoader<T> = () => Promise<T>

type LazyRepositoryHandle<T extends object> = {
  repository: T
  getResolvedRepository: () => T | null
  getRepository: () => Promise<T>
}

/**
 * Generic lazy repository loader.
 *
 * Purpose:
 * - Keep Firebase SDK out of mock mode until a repository method is actually used.
 * - Avoid duplicate repository instances by caching the load promise.
 * - Preserve a synchronous API for callers while still deferring initialization.
 */
export function createLazyRepository<T extends object>(
  loader: RepositoryLoader<T>,
): LazyRepositoryHandle<T> {
  // Cache the resolved repository so we only initialize it once.
  let resolvedRepository: T | null = null
  // Cache the in-flight load to prevent duplicate imports.
  let loadingRepository: Promise<T> | null = null
  // Cache the error so repeated calls fail consistently.
  let loadError: Error | null = null

  const getRepository = async (): Promise<T> => {
    if (resolvedRepository) return resolvedRepository
    if (loadError) throw loadError
    if (!loadingRepository) {
      loadingRepository = loader()
        .then((repository) => {
          resolvedRepository = repository
          return repository
        })
        .catch((error) => {
          loadError = error instanceof Error ? error : new Error(String(error))
          throw loadError
        })
    }

    return loadingRepository
  }

  // Proxy all method calls through the lazy loader.
  const repository = new Proxy({} as T, {
    get(_target, prop: string | symbol) {
      if (prop === Symbol.toStringTag) return 'LazyRepository'
      return async (...args: unknown[]) => {
        const resolved = await getRepository()
        const value = resolved[prop as keyof T]
        if (typeof value !== 'function') {
          return value
        }
        return value.apply(resolved, args as [])
      }
    },
  })

  return {
    repository,
    getResolvedRepository: () => resolvedRepository,
    getRepository,
  }
}

/**
 * Auth repository wrapper.
 * Handles synchronous methods that cannot be made async without changing API shape.
 */
export function createLazyAuthRepository(
  loader: RepositoryLoader<IAuthRepository>,
): IAuthRepository {
  const { repository, getRepository, getResolvedRepository } =
    createLazyRepository<IAuthRepository>(loader)

  return Object.assign(repository, {
    getCurrentUser() {
      // Avoid forcing Firebase init just to read currentUser.
      // If the repo isn't ready yet, return null and trigger lazy load.
      const resolved = getResolvedRepository()
      if (resolved) return resolved.getCurrentUser()
      void getRepository()
      return null
    },
    onAuthStateChanged: ((
      callback: Parameters<IAuthRepository['onAuthStateChanged']>[0],
    ) => {
      let unsubscribe: (() => void) | null = null
      let cancelled = false

      void getRepository().then((resolvedRepository) => {
        if (cancelled) return
        unsubscribe = resolvedRepository.onAuthStateChanged(callback)
      })

      return () => {
        cancelled = true
        if (unsubscribe) unsubscribe()
      }
    }) as IAuthRepository['onAuthStateChanged'],
  })
}

/**
 * Data repository wrapper.
 * Preserves a synchronous unsubscribe return while still lazy-loading.
 */
export function createLazyDataRepository(
  loader: RepositoryLoader<IDataRepository>,
): IDataRepository {
  const { repository, getRepository } = createLazyRepository<IDataRepository>(loader)

  return Object.assign(repository, {
    onCollectionChange: ((
      collectionName: Parameters<IDataRepository['onCollectionChange']>[0],
      callback: Parameters<IDataRepository['onCollectionChange']>[1],
      constraints: Parameters<IDataRepository['onCollectionChange']>[2],
    ) => {
      let unsubscribe: (() => void) | null = null
      let cancelled = false

      void getRepository().then((resolvedRepository) => {
        if (cancelled) return
        unsubscribe = resolvedRepository.onCollectionChange(
          collectionName,
          callback,
          constraints,
        )
      })

      return () => {
        cancelled = true
        if (unsubscribe) unsubscribe()
      }
    }) as IDataRepository['onCollectionChange'],
  })
}

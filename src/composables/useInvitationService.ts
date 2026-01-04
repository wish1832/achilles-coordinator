import type { IInvitationService } from '@/services/invitations'

type RepoBackend = 'firebase' | 'mock'

type ServiceLoader<T> = () => Promise<T>

function getBackend(): RepoBackend {
  if (import.meta.env.MODE === 'test') return 'mock'
  const v = (import.meta.env.VITE_REPO_BACKEND ?? 'firebase') as RepoBackend
  if (v !== 'mock' && v !== 'firebase') return 'firebase'
  return v
}

let cachedFirebaseInvitationService: Promise<IInvitationService> | null = null
let cachedMockInvitationService: Promise<IInvitationService> | null = null

function loadFirebaseInvitationService(): Promise<IInvitationService> {
  if (!cachedFirebaseInvitationService) {
    cachedFirebaseInvitationService = import('@/services/invitations').then(
      (module) => module.firebaseInvitationService,
    )
  }

  return cachedFirebaseInvitationService
}

function loadMockInvitationService(): Promise<IInvitationService> {
  if (!cachedMockInvitationService) {
    cachedMockInvitationService = import('@/services/invitations').then(
      (module) => module.mockInvitationService,
    )
  }

  return cachedMockInvitationService
}

function createLazyInvitationService(
  loader: ServiceLoader<IInvitationService>,
): IInvitationService {
  let resolvedService: IInvitationService | null = null
  let loadingService: Promise<IInvitationService> | null = null

  const getService = async (): Promise<IInvitationService> => {
    if (resolvedService) return resolvedService
    if (!loadingService) {
      loadingService = loader().then((service) => {
        resolvedService = service
        return service
      })
    }

    return loadingService
  }

  return {
    async sendOrganizationInvite(invite) {
      const service = await getService()
      return service.sendOrganizationInvite(invite)
    },
  }
}

export function useInvitationService(): IInvitationService {
  const backend = getBackend()
  if (backend === 'mock') return createLazyInvitationService(loadMockInvitationService)
  return createLazyInvitationService(loadFirebaseInvitationService)
}

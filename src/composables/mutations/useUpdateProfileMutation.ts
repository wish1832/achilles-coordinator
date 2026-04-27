import { useMutation } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

/**
 * Update the current user's profile details (name, pace, etc.).
 * Delegates to authStore.updateProfile so the in-memory user record and
 * Firestore document are updated atomically. No cache invalidation is
 * needed because auth store state is the authoritative source for the
 * current user rather than a TanStack Query entry.
 */
export function useUpdateProfileMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: async (profileDetails: Partial<User['profileDetails']>) => {
      // Update the current user's profile details via auth store
      return authStore.updateProfile({ profileDetails })
    },
  })
}

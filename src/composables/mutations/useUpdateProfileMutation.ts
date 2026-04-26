import { useMutation } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

export function useUpdateProfileMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: async (profileDetails: Partial<User['profileDetails']>) => {
      // Update the current user's profile details via auth store
      return authStore.updateProfile({ profileDetails })
    },
  })
}

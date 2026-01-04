import type { OrganizationInvite } from '@/types/models'
import type { IInvitationService, OrganizationInviteDeliveryResult } from './types'

/**
 * Mock invitation service.
 * Logs a placeholder invite link for local development.
 */
export class MockInvitationService implements IInvitationService {
  async sendOrganizationInvite(
    invite: OrganizationInvite,
  ): Promise<OrganizationInviteDeliveryResult> {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost:5173'
    const inviteLink = `${origin}/invite/${invite.id}`

    console.info('Mock invite link created:', inviteLink, invite.email)
    return { inviteLink }
  }
}

export const mockInvitationService = new MockInvitationService()

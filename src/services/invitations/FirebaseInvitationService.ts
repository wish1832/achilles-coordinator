import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/firebase/client'
import type { OrganizationInvite } from '@/types/models'
import type { IInvitationService, OrganizationInviteDeliveryResult } from './types'

/**
 * Firebase invitation service.
 * Expects a backend Cloud Function to send invite emails and set up auth accounts.
 */
export class FirebaseInvitationService implements IInvitationService {
  async sendOrganizationInvite(
    invite: OrganizationInvite,
  ): Promise<OrganizationInviteDeliveryResult> {
    const functions = getFirebaseFunctions()
    const sendInvite = httpsCallable(functions, 'sendOrganizationInvite')

    const result = await sendInvite({
      inviteId: invite.id,
      organizationId: invite.organizationId,
      email: invite.email,
      role: invite.role,
      invitedByUserId: invite.invitedByUserId,
      displayName: invite.displayName ?? null,
    })

    return (result.data as OrganizationInviteDeliveryResult) ?? {}
  }
}

export const firebaseInvitationService = new FirebaseInvitationService()

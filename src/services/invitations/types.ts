import type { OrganizationInvite } from '@/types/models'

export type OrganizationInviteDeliveryResult = {
  inviteLink?: string
}

export interface IInvitationService {
  sendOrganizationInvite(invite: OrganizationInvite): Promise<OrganizationInviteDeliveryResult>
}

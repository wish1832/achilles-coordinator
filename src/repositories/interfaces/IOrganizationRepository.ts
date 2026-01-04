import type { Organization, Location } from '@/types/models'

/**
 * Organization repository interface.
 * Organizations own locations and membership/admin relationships.
 */
export interface IOrganizationRepository {
  createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string>
  updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void>
  deleteOrganization(id: string): Promise<void>
  getOrganization(id: string): Promise<Organization | null>
  getOrganizations(): Promise<Organization[]>
  getUserOrganizations(userId: string): Promise<Organization[]>
  getUserAdminOrganizations(userId: string): Promise<Organization[]>
  addOrganizationMember(organizationId: string, userId: string): Promise<void>
  removeOrganizationMember(organizationId: string, userId: string): Promise<void>
  addOrganizationAdmin(organizationId: string, userId: string): Promise<void>
  removeOrganizationAdmin(organizationId: string, userId: string): Promise<void>

  createLocation(locationData: Omit<Location, 'id'>): Promise<string>
  updateLocation(id: string, locationData: Partial<Omit<Location, 'id'>>): Promise<void>
  deleteLocation(id: string): Promise<void>
  getLocation(id: string): Promise<Location | null>
  getLocationsForOrganization(organizationId: string): Promise<Location[]>
}

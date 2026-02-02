import type { Location, Organization } from '@/types/models'
import type { IOrganizationRepository } from '@/repositories/interfaces/IOrganizationRepository'
import { clone, getCollection, nextId, setCollection } from './mockState'
import { MockCollectionHelper } from './internal/MockCollectionHelper'

export class MockOrganizationRepository implements IOrganizationRepository {
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    const id = nextId('org')
    await this.collectionHelper.setDocument('organizations', id, organizationData)
    return id
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    await this.collectionHelper.updateDocument('organizations', id, organizationData)
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('organizations', id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.collectionHelper.getDocument('organizations', id)
  }

  async getOrganizations(): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.sort((a, b) => a.name.localeCompare(b.name))
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.filter((org) => org.memberIds.includes(userId))
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.filter((org) => org.adminIds.includes(userId))
  }

  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = await this.collectionHelper.getDocument<Organization>(
      'organizations',
      organizationId,
    )
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    const memberIds = organization.memberIds.includes(userId)
      ? organization.memberIds
      : [...organization.memberIds, userId]
    await this.collectionHelper.updateDocument('organizations', organizationId, {
      memberIds,
    })
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = await this.collectionHelper.getDocument<Organization>(
      'organizations',
      organizationId,
    )
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    await this.collectionHelper.updateDocument('organizations', organizationId, {
      memberIds: organization.memberIds.filter((id) => id !== userId),
      adminIds: organization.adminIds.filter((id) => id !== userId),
    })
  }

  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    const organization = await this.collectionHelper.getDocument<Organization>(
      'organizations',
      organizationId,
    )
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    const memberIds = organization.memberIds.includes(userId)
      ? organization.memberIds
      : [...organization.memberIds, userId]
    const adminIds = organization.adminIds.includes(userId)
      ? organization.adminIds
      : [...organization.adminIds, userId]
    await this.collectionHelper.updateDocument('organizations', organizationId, {
      memberIds,
      adminIds,
    })
  }

  async removeOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    const organization = await this.collectionHelper.getDocument<Organization>(
      'organizations',
      organizationId,
    )
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    await this.collectionHelper.updateDocument('organizations', organizationId, {
      adminIds: organization.adminIds.filter((id) => id !== userId),
    })
  }

  async createLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    const id = nextId('location')
    await this.collectionHelper.setDocument('locations', id, locationData)
    return id
  }

  async updateLocation(id: string, locationData: Partial<Omit<Location, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('locations', id, locationData)
  }

  async deleteLocation(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('locations', id)
  }

  async getLocation(id: string): Promise<Location | null> {
    return this.collectionHelper.getDocument('locations', id)
  }

  async getLocationsForOrganization(organizationId: string): Promise<Location[]> {
    const locations = await this.collectionHelper.getDocuments<Location>('locations')
    return locations
      .filter((entry) => entry.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}

export const mockOrganizationRepository = new MockOrganizationRepository()

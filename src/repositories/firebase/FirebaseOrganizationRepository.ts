import { arrayRemove, arrayUnion, orderBy, where, type Firestore } from 'firebase/firestore'
import { getFirebaseDb } from '@/firebase/client'
import type { Organization, Location } from '@/types/models'
import type { IOrganizationRepository } from '../interfaces/IOrganizationRepository'
import { FirestoreCollectionHelper } from './internal/FirestoreCollectionHelper'

/**
 * Firebase implementation of the organization repository.
 * Handles organizations and organization-owned locations.
 */
export class FirebaseOrganizationRepository implements IOrganizationRepository {
  private getDb(): Firestore {
    return getFirebaseDb()
  }

  private readonly collectionHelper = new FirestoreCollectionHelper(() => this.getDb())

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('organizations', organizationData, {
      includeCreatedAt: true,
    })
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    await this.collectionHelper.updateDocument('organizations', id, organizationData, {
      includeUpdatedAt: true,
    })
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('organizations', id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.collectionHelper.getDocument('organizations', id)
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.collectionHelper.getDocuments('organizations', [orderBy('name')])
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return this.collectionHelper.getDocuments('organizations', [
      where('memberIds', 'array-contains', userId),
      orderBy('name'),
    ])
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    return this.collectionHelper.getDocuments('organizations', [
      where('adminIds', 'array-contains', userId),
      orderBy('name'),
    ])
  }

  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    await this.collectionHelper.updateDocument<Organization>(
      'organizations',
      organizationId,
      {
        memberIds: arrayUnion(userId),
      },
      { includeUpdatedAt: true },
    )
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    await this.collectionHelper.updateDocument<Organization>(
      'organizations',
      organizationId,
      {
        memberIds: arrayRemove(userId),
        adminIds: arrayRemove(userId),
      },
      { includeUpdatedAt: true },
    )
  }

  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    await this.collectionHelper.updateDocument<Organization>(
      'organizations',
      organizationId,
      {
        memberIds: arrayUnion(userId),
        adminIds: arrayUnion(userId),
      },
      { includeUpdatedAt: true },
    )
  }

  async removeOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    await this.collectionHelper.updateDocument<Organization>(
      'organizations',
      organizationId,
      {
        adminIds: arrayRemove(userId),
      },
      { includeUpdatedAt: true },
    )
  }

  async createLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('locations', locationData, {
      includeCreatedAt: true,
    })
  }

  async updateLocation(id: string, locationData: Partial<Omit<Location, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('locations', id, locationData, {
      includeUpdatedAt: true,
    })
  }

  async deleteLocation(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('locations', id)
  }

  async getLocation(id: string): Promise<Location | null> {
    return this.collectionHelper.getDocument('locations', id)
  }

  async getLocationsForOrganization(organizationId: string): Promise<Location[]> {
    return this.collectionHelper.getDocuments('locations', [
      where('organizationId', '==', organizationId),
      orderBy('name'),
    ])
  }
}

export const firebaseOrganizationRepository = new FirebaseOrganizationRepository()

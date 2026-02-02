import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import type { Location, Organization, Run, SignUp, User } from '@/types/models'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import { clone, getCollection, nextId, setCollection, type CollectionName } from './mockState'
import { MockCollectionHelper } from './internal/MockCollectionHelper'
import { MockRunRepository } from './MockRunRepository'
import { MockOrganizationRepository } from './MockOrganizationRepository'

export class MockDataRepository implements IDataRepository {
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })
  private readonly runRepository = new MockRunRepository()
  private readonly organizationRepository = new MockOrganizationRepository()
  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    return this.collectionHelper.addDocument(collectionName as CollectionName, data)
  }

  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    return this.collectionHelper.updateDocument(collectionName as CollectionName, id, data)
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    return this.collectionHelper.deleteDocument(collectionName as CollectionName, id)
  }

  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    return this.collectionHelper.getDocument(collectionName as CollectionName, id)
  }

  async getDocuments<T extends { id: string }>(
    collectionName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Promise<T[]> {
    return this.collectionHelper.getDocuments(collectionName as CollectionName)
  }

  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Unsubscribe {
    return this.collectionHelper.onCollectionChange(collectionName as CollectionName, callback)
  }

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    const id = nextId('user')
    await this.collectionHelper.setDocument('users', id, userData)
    return id
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('users', id, userData)
  }

  async getUser(id: string): Promise<User | null> {
    return this.collectionHelper.getDocument('users', id)
  }

  async getUsers(): Promise<User[]> {
    const users = await this.collectionHelper.getDocuments<User>('users')
    return users.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    return this.runRepository.createRun(runData)
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    return this.runRepository.updateRun(id, runData)
  }

  async deleteRun(id: string): Promise<void> {
    return this.runRepository.deleteRun(id)
  }

  async getRun(id: string): Promise<Run | null> {
    return this.runRepository.getRun(id)
  }

  async getRuns(): Promise<Run[]> {
    return this.runRepository.getRuns()
  }

  async getUpcomingRuns(): Promise<Run[]> {
    return this.runRepository.getUpcomingRuns()
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    return this.runRepository.createSignUp(signUpData)
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.runRepository.updateSignUp(id, signUpData)
  }

  async deleteSignUp(id: string): Promise<void> {
    return this.runRepository.deleteSignUp(id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    return this.runRepository.getSignUpsForRun(runId)
  }

  async getUserSignUps(userId: string): Promise<SignUp[]> {
    return this.runRepository.getSignUpsForUser(userId)
  }

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    return this.organizationRepository.createOrganization(organizationData)
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    return this.organizationRepository.updateOrganization(id, organizationData)
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.organizationRepository.deleteOrganization(id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.organizationRepository.getOrganization(id)
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.getOrganizations()
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return this.organizationRepository.getUserOrganizations(userId)
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    return this.organizationRepository.getUserAdminOrganizations(userId)
  }

  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    return this.organizationRepository.addOrganizationMember(organizationId, userId)
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    return this.organizationRepository.removeOrganizationMember(organizationId, userId)
  }

  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    return this.organizationRepository.addOrganizationAdmin(organizationId, userId)
  }

  async removeOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    return this.organizationRepository.removeOrganizationAdmin(organizationId, userId)
  }

  async createLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    return this.organizationRepository.createLocation(locationData)
  }

  async updateLocation(
    id: string,
    locationData: Partial<Omit<Location, 'id'>>,
  ): Promise<void> {
    return this.organizationRepository.updateLocation(id, locationData)
  }

  async deleteLocation(id: string): Promise<void> {
    return this.organizationRepository.deleteLocation(id)
  }

  async getLocation(id: string): Promise<Location | null> {
    return this.organizationRepository.getLocation(id)
  }

  async getLocationsForOrganization(organizationId: string): Promise<Location[]> {
    return this.organizationRepository.getLocationsForOrganization(organizationId)
  }
}

export const mockDataRepository = new MockDataRepository()

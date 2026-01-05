import type { User } from '@/types/models'
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import { clone, getCollection, nextId, setCollection } from './mockState'
import { MockCollectionHelper } from './internal/MockCollectionHelper'

export class MockUserRepository implements IUserRepository {
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })

  async createUser(id: string, userData: Omit<User, 'id'>): Promise<void> {
    await this.collectionHelper.setDocument('users', id, userData)
  }

  async createUserWithGeneratedId(userData: Omit<User, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('users', userData)
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('users', id, userData)
  }

  async getUser(id: string): Promise<User | null> {
    return this.collectionHelper.getDocument('users', id)
  }

  async getUsers(): Promise<User[]> {
    const users = await this.collectionHelper.getDocuments<User>('users')
    return users.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.collectionHelper.getDocuments<User>('users')
    return users.find((entry) => entry.email === email) ?? null
  }
}

export const mockUserRepository = new MockUserRepository()

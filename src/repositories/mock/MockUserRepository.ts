import type { User } from '@/types/models'
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import { clone, mockState } from './mockState'

export class MockUserRepository implements IUserRepository {
  async createUser(id: string, userData: Omit<User, 'id'>): Promise<void> {
    const existing = mockState.users.find((entry) => entry.id === id)
    if (existing) {
      throw new Error(`User ${id} already exists`)
    }
    mockState.users.push({ ...clone(userData), id })
  }

  async createUserWithGeneratedId(userData: Omit<User, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('users', userData)
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    const index = mockState.users.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`User ${id} not found`)
    }
    mockState.users[index] = { ...mockState.users[index], ...clone(userData) } as User
  }

  async getUser(id: string): Promise<User | null> {
    const user = mockState.users.find((entry) => entry.id === id)
    return user ? clone(user) : null
  }

  async getUsers(): Promise<User[]> {
    return clone(mockState.users).sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = mockState.users.find((entry) => entry.email === email)
    return user ? clone(user) : null
  }
}

export const mockUserRepository = new MockUserRepository()

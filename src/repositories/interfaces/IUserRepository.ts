import type { User } from '@/types/models'

/**
 * User repository interface.
 * Operations for user profiles and user listing.
 */
export interface IUserRepository {
  createUser(id: string, userData: Omit<User, 'id'>): Promise<void>
  createUserWithGeneratedId(userData: Omit<User, 'id'>): Promise<string>
  updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void>
  getUser(id: string): Promise<User | null>
  getUsers(): Promise<User[]>
  getUserByEmail(email: string): Promise<User | null>
}

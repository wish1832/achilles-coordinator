import type { SignUp } from '@/types/models'
import type { ISignUpRepository } from '@/repositories/interfaces/ISignUpRepository'
import { clone, getCollection, nextId, setCollection } from './mockState'
import { MockCollectionHelper } from './internal/MockCollectionHelper'

/**
 * Sort sign-ups by timestamp in descending order (most recent first).
 * @param items - Array of sign-ups to sort
 * @returns New sorted array
 */
function sortByTimestampDescending(items: SignUp[]): SignUp[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

/**
 * Mock implementation of the sign-up repository.
 * Mirrors Firebase behavior while remaining fully in-memory for tests.
 * Sign-ups are stored in the shared mockState signups collection.
 */
export class MockSignUpRepository implements ISignUpRepository {
  // Helper class for common mock CRUD operations.
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })

  /**
   * Create a new sign-up in the mock state.
   * @param signUpData - SignUp data (without id)
   * @returns Promise resolving to the new sign-up document ID
   */
  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    const id = nextId('signup')
    await this.collectionHelper.setDocument('signups', id, signUpData)
    return id
  }

  /**
   * Update an existing sign-up in the mock state.
   * @param id - SignUp document ID
   * @param signUpData - Partial sign-up data to update
   */
  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('signups', id, signUpData)
  }

  /**
   * Delete a sign-up from the mock state.
   * @param id - SignUp document ID
   */
  async deleteSignUp(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('signups', id)
  }

  /**
   * Get a sign-up by ID from the mock state.
   * @param id - SignUp document ID
   * @returns Promise resolving to the sign-up data or null if not found
   */
  async getSignUp(id: string): Promise<SignUp | null> {
    return this.collectionHelper.getDocument('signups', id)
  }

  /**
   * Get all sign-ups for a specific run, ordered by timestamp descending.
   * @param runId - Run document ID
   * @returns Promise resolving to array of sign-ups for the run
   */
  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups')
    // Filter by runId and sort by timestamp descending.
    return sortByTimestampDescending(signUps.filter((entry) => entry.runId === runId))
  }

  /**
   * Get all sign-ups for a specific user, ordered by timestamp descending.
   * @param userId - User document ID
   * @returns Promise resolving to array of sign-ups for the user
   */
  async getSignUpsForUser(userId: string): Promise<SignUp[]> {
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups')
    // Filter by userId and sort by timestamp descending.
    return sortByTimestampDescending(signUps.filter((entry) => entry.userId === userId))
  }

  /**
   * Get a user's sign-up for a specific run, if it exists.
   * Useful for checking if a user has already signed up for a run.
   * @param runId - Run document ID
   * @param userId - User document ID
   * @returns Promise resolving to the sign-up data or null if not found
   */
  async getSignUpForRunAndUser(runId: string, userId: string): Promise<SignUp | null> {
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups')
    // Find the first sign-up matching both runId and userId.
    const signUp = signUps.find((entry) => entry.runId === runId && entry.userId === userId)
    return signUp ?? null
  }
}

// Singleton instance for use in tests and local development.
export const mockSignUpRepository = new MockSignUpRepository()

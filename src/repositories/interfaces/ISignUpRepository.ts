import type { SignUp } from '@/types/models'

/**
 * SignUp repository interface.
 * Defines CRUD operations for the signups collection.
 * Sign-ups are stored in a top-level collection so users can manage their signups
 * without requiring write access to run documents (which are admin-only).
 */
export interface ISignUpRepository {
  /**
   * Create a new sign-up document
   * @param signUpData - SignUp data (without id)
   * @returns Promise resolving to the new sign-up document ID
   * @throws Error if sign-up creation fails
   */
  createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string>

  /**
   * Update an existing sign-up document
   * @param id - SignUp document ID
   * @param signUpData - Partial sign-up data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if sign-up update fails
   */
  updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void>

  /**
   * Delete a sign-up document
   * @param id - SignUp document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if sign-up deletion fails
   */
  deleteSignUp(id: string): Promise<void>

  /**
   * Get a sign-up document by ID
   * @param id - SignUp document ID
   * @returns Promise resolving to the sign-up data or null if not found
   * @throws Error if retrieval fails
   */
  getSignUp(id: string): Promise<SignUp | null>

  /**
   * Get all sign-ups for a specific run, ordered by timestamp (descending)
   * @param runId - Run document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  getSignUpsForRun(runId: string): Promise<SignUp[]>

  /**
   * Get all sign-ups for a specific user, ordered by timestamp (descending)
   * @param userId - User document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  getSignUpsForUser(userId: string): Promise<SignUp[]>

  /**
   * Get a user's sign-up for a specific run, if it exists
   * @param runId - Run document ID
   * @param userId - User document ID
   * @returns Promise resolving to the sign-up data or null if not found
   * @throws Error if retrieval fails
   */
  getSignUpForRunAndUser(runId: string, userId: string): Promise<SignUp | null>
}

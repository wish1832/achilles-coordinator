import type { User as FirebaseUser } from 'firebase/auth'
/**
 * Authentication repository interface
 * Defines the contract for all authentication operations
 * This abstraction allows for multiple implementations:
 * - Production: Real Firebase Authentication
 * - Unit tests: In-memory mock implementation
 * - Integration tests: Firebase Emulator implementation
 */
export interface IAuthRepository {
  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to Firebase User object
   * @throws Error if authentication fails
   */
  signIn(email: string, password: string): Promise<FirebaseUser>

  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   * @throws Error if sign out fails
   */
  signOut(): Promise<void>

  /**
   * Create a new user account (admin only)
   * This creates a Firebase Auth user only (profile data lives in the user repository).
   * @param email - User's email address
   * @param password - User's password
   * @param displayName - User's display name
   * @returns Promise resolving to Firebase User object
   * @throws Error if user creation fails
   */
  createUser(email: string, password: string, displayName: string): Promise<FirebaseUser>

  /**
   * Get the current authenticated user
   * @returns Current Firebase User or null if not authenticated
   */
  getCurrentUser(): FirebaseUser | null

  /**
   * Listen to authentication state changes
   * The callback is invoked immediately with the current user state,
   * and then again whenever the authentication state changes
   * @param callback - Function to call when auth state changes, receives user or null
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void
}

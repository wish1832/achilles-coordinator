import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { UserRole } from '@/types/models'
import type { IAuthRepository } from '../interfaces/IAuthRepository'

/**
 * Firebase implementation of the authentication repository
 * This is the production implementation that uses the real Firebase Authentication SDK
 * For testing, use MockAuthRepository (unit tests) or EmulatorAuthRepository (integration tests)
 */
export class FirebaseAuthRepository implements IAuthRepository {
  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to Firebase User object
   * @throws Error if authentication fails
   */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      // Use Firebase Auth to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   * @throws Error if sign out fails
   */
  async signOut(): Promise<void> {
    try {
      // Use Firebase Auth to sign out
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Create a new user account (admin only)
   * This creates both a Firebase Auth user and a Firestore user document
   * Note: This is for invite-only registration where admins create accounts
   * @param email - User's email address
   * @param password - User's password
   * @param displayName - User's display name
   * @param role - User's role (athlete or guide)
   * @returns Promise resolving to Firebase User object
   * @throws Error if user creation fails
   */
  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<FirebaseUser> {
    try {
      // Step 1: Create the Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Step 2: Update the user's display name in Firebase Auth
      await updateProfile(user, { displayName })

      // Step 3: Create the corresponding user document in Firestore
      // Use the auth UID as the document ID to keep them in sync
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email ?? email,
        displayName,
        role,
        createdAt: Timestamp.now(),
        profileDetails: {},
      })

      return user
    } catch (error) {
      console.error('Create user error:', error)
      throw error
    }
  }

  /**
   * Get the current authenticated user
   * @returns Current Firebase User or null if not authenticated
   */
  getCurrentUser(): FirebaseUser | null {
    // Firebase Auth stores the current user in auth.currentUser
    return auth.currentUser
  }

  /**
   * Listen to authentication state changes
   * The callback is invoked immediately with the current user state,
   * and then again whenever the authentication state changes
   * @param callback - Function to call when auth state changes, receives user or null
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    // Use Firebase Auth's onAuthStateChanged listener
    // This will call the callback immediately with the current state,
    // and then again whenever the auth state changes
    return onAuthStateChanged(auth, callback)
  }
}

// Export a singleton instance for use throughout the application
export const firebaseAuthRepository = new FirebaseAuthRepository()

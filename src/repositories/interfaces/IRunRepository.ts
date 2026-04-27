import type { Run, SignUp } from '@/types/models'

/**
 * Run repository interface.
 * Signups stay in a top-level collection so users can manage their signups
 * without requiring write access to run documents (admin-only).
 */
export interface IRunRepository {
  createRun(runData: Omit<Run, 'id'>): Promise<string>
  updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void>
  deleteRun(id: string): Promise<void>
  getRun(id: string): Promise<Run | null>
  getRuns(): Promise<Run[]>
  getUpcomingRuns(): Promise<Run[]>
  getRunsForOrganization(organizationId: string): Promise<Run[]>
  /**
   * Fetch runs for an organization within a timeframe.
   *
   * Either `from`, `to`, or both may be provided. When both are omitted the
   * call is equivalent to {@link getRunsForOrganization}. `limit` caps the
   * number of runs returned (used for "most recent past runs" feeds).
   *
   * `direction` controls sort order on the run date: 'asc' for upcoming-style
   * lists, 'desc' for past-style feeds.
   */
  getRunsForOrganizationInTimeframe(
    organizationId: string,
    options: {
      from?: Date
      to?: Date
      direction?: 'asc' | 'desc'
      limit?: number
    },
  ): Promise<Run[]>
  getRunsAtLocation(locationId: string): Promise<Run[]>

  createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string>
  updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void>
  deleteSignUp(id: string): Promise<void>
  getSignUpsForRun(runId: string): Promise<SignUp[]>
  getSignUpsForUser(userId: string): Promise<SignUp[]>
}

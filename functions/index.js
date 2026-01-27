const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

admin.initializeApp()

exports.sendOrganizationInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign-in required to send invites.')
  }

  const { inviteId, organizationId, email, role, displayName } = request.data || {}

  if (!inviteId || !organizationId || !email || !role) {
    throw new HttpsError('invalid-argument', 'Missing required invite data.')
  }

  // TODO: Create Auth user if missing and send a password setup email.
  // Suggested flow:
  // 1) Look up or create auth user by email via Admin SDK.
  // 2) Generate a password reset link with actionCodeSettings.
  // 3) Send the invite email (link + org details).

  console.info('Invite requested', {
    inviteId,
    organizationId,
    email,
    role,
    displayName,
    invitedByUserId: request.auth.uid,
  })

  return { inviteLink: null }
})

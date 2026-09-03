/*
 * _adminApp.cjs  -  shared Firebase Admin bootstrap for the local seed scripts.
 *
 * Credential resolution order (first that works wins):
 *   1. A service-account key JSON  (scripts/serviceAccountKey.json, a path passed
 *      as argv, or GOOGLE_APPLICATION_CREDENTIALS)
 *   2. The Firebase CLI's stored user credentials
 *      (~/.config/configstore/firebase-tools.json) - i.e. whoever ran
 *      `firebase login`. Uses firebase-tools' public OAuth client, exactly as
 *      the CLI itself does.
 *
 * The Admin SDK bypasses Firestore security rules, so seeding works without
 * loosening the deployed rules. No secret is printed or committed.
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const admin = require('firebase-admin')

const PROJECT_ID = 'project-5224e'

// Public OAuth client shipped inside firebase-tools (open source). Using it to
// refresh the local CLI's own token is exactly what `firebase` does.
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

function findServiceAccountKey() {
  const candidates = [
    process.argv.slice(2).find(a => a.toLowerCase().endsWith('.json')),
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, '..', 'serviceAccountKey.json'),
  ].filter(Boolean)
  return candidates.find(c => {
    try { return fs.existsSync(c) } catch { return false }
  }) || null
}

function readCliRefreshToken() {
  const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json')
  if (!fs.existsSync(cfgPath)) return null
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    const rt = cfg && cfg.tokens && cfg.tokens.refresh_token
    const email = (cfg && cfg.user && cfg.user.email) || 'unknown'
    return rt ? { refreshToken: rt, email } : null
  } catch {
    return null
  }
}

function initAdminApp() {
  if (admin.apps.length) return { app: admin.app(), how: 'already-initialised' }

  const keyPath = findServiceAccountKey()
  if (keyPath) {
    const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || PROJECT_ID })
    return { app: admin.app(), how: `service account (${sa.client_email})`, projectId: sa.project_id || PROJECT_ID }
  }

  const cli = readCliRefreshToken()
  if (cli) {
    // The Firestore Admin SDK rejects a bare user (refreshToken) credential, but
    // it DOES accept an "authorized_user" Application Default Credentials file.
    // Materialise one from the CLI's refresh token and point ADC at it.
    const adcPath = path.join(os.tmpdir(), 'hms-seed-adc.json')
    fs.writeFileSync(
      adcPath,
      JSON.stringify({
        type: 'authorized_user',
        client_id: FIREBASE_CLI_CLIENT_ID,
        client_secret: FIREBASE_CLI_CLIENT_SECRET,
        refresh_token: cli.refreshToken,
      }),
      { mode: 0o600 }
    )
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath
    process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    })
    return {
      app: admin.app(),
      how: `Firebase CLI login (${cli.email})`,
      projectId: PROJECT_ID,
      cleanup: () => { try { fs.unlinkSync(adcPath) } catch { /* ignore */ } },
    }
  }

  throw new Error(
    'No credentials. Either place scripts/serviceAccountKey.json, or run `npx firebase login`.'
  )
}

module.exports = { initAdminApp, PROJECT_ID }

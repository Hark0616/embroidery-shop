const truthyValues = new Set(['1', 'true', 'yes', 'on'])

type LocalAdminBypassEnv = {
  NODE_ENV?: string
  LOCAL_ADMIN_BYPASS?: string
  LOCAL_ADMIN_EMAIL?: string
}

export function isLocalAdminBypassEnabled(env: LocalAdminBypassEnv = process.env) {
  const value = env.LOCAL_ADMIN_BYPASS?.trim().toLowerCase()

  return env.NODE_ENV !== 'production' && !!value && truthyValues.has(value)
}

export function getLocalAdminUser(env: LocalAdminBypassEnv = process.env) {
  if (!isLocalAdminBypassEnabled(env)) {
    return null
  }

  return {
    id: 'local-admin',
    aud: 'authenticated',
    role: 'authenticated',
    email: env.LOCAL_ADMIN_EMAIL?.trim() || 'local-admin@texere.dev',
    app_metadata: {
      role: 'admin',
      provider: 'local-bypass',
    },
    user_metadata: {
      name: 'Local Admin',
    },
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  }
}

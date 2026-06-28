import test from 'node:test'
import assert from 'node:assert/strict'
import { getLocalAdminUser, isLocalAdminBypassEnabled } from '../lib/auth/local-bypass'

test('local admin bypass stays disabled by default', () => {
  assert.equal(isLocalAdminBypassEnabled({ NODE_ENV: 'development' }), false)
  assert.equal(getLocalAdminUser({ NODE_ENV: 'development' }), null)
})

test('local admin bypass accepts explicit truthy local values', () => {
  const env = {
    NODE_ENV: 'development',
    LOCAL_ADMIN_BYPASS: 'true',
    LOCAL_ADMIN_EMAIL: 'dev-admin@texere.dev',
  }

  assert.equal(isLocalAdminBypassEnabled(env), true)

  const user = getLocalAdminUser(env)
  assert.equal(user?.email, 'dev-admin@texere.dev')
  assert.equal(user?.app_metadata.role, 'admin')
  assert.equal(user?.app_metadata.provider, 'local-bypass')
})

test('local admin bypass never runs in production', () => {
  const env = {
    NODE_ENV: 'production',
    LOCAL_ADMIN_BYPASS: 'true',
    LOCAL_ADMIN_EMAIL: 'dev-admin@texere.dev',
  }

  assert.equal(isLocalAdminBypassEnabled(env), false)
  assert.equal(getLocalAdminUser(env), null)
})

test('local admin bypass provides a stable fallback email', () => {
  const user = getLocalAdminUser({
    NODE_ENV: 'test',
    LOCAL_ADMIN_BYPASS: '1',
  })

  assert.equal(user?.id, 'local-admin')
  assert.equal(user?.email, 'local-admin@texere.dev')
  assert.equal(user?.role, 'authenticated')
})

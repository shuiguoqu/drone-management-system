import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldForceLoginRedirect } from '../src/api/authRedirectPolicy.js'

test('does not force redirect on login API 401', () => {
  assert.equal(
    shouldForceLoginRedirect({
      status: 401,
      requestUrl: '/auth/login',
      currentPath: '/login'
    }),
    false
  )
})

test('forces redirect on protected API 401 outside login page', () => {
  assert.equal(
    shouldForceLoginRedirect({
      status: 401,
      requestUrl: '/drones',
      currentPath: '/'
    }),
    true
  )
})

test('does not force redirect when already on login route', () => {
  assert.equal(
    shouldForceLoginRedirect({
      status: 401,
      requestUrl: '/drones',
      currentPath: '/login'
    }),
    false
  )
})

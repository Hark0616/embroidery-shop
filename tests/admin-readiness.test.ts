import test from 'node:test'
import assert from 'node:assert/strict'
import { canActivateGarment, getGarmentReadiness } from '../lib/admin/readiness'

test('a garment without a published calibrated mockup cannot be activated', () => {
  const mockups = [
    { status: 'needs_calibration', is_public: false, surfaces: {} },
    { status: 'calibrated', is_public: false, surfaces: { pecho: { id: 'pecho' } } },
  ]

  assert.equal(canActivateGarment(mockups), false)
  assert.equal(getGarmentReadiness({ is_active: false }, mockups).canActivate, false)
})

test('a garment with a public published calibrated mockup can be activated', () => {
  const mockups = [
    { status: 'published', is_public: true, surfaces: { pecho: { id: 'pecho' } } },
  ]

  assert.equal(canActivateGarment(mockups), true)
  assert.equal(getGarmentReadiness({ is_active: false }, mockups).label, 'Listo para activar')
  assert.equal(getGarmentReadiness({ is_active: true }, mockups).label, 'Activa en Studio')
})

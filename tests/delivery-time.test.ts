import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_DELIVERY_TIME_MESSAGE,
  DELIVERY_TIME_KEY,
  LEGACY_DELIVERY_TIME_KEY,
  resolveDeliveryTime,
} from '../lib/config/delivery-time'

test('resolveDeliveryTime prefers the current public config key', () => {
  assert.equal(
    resolveDeliveryTime([
      { key: LEGACY_DELIVERY_TIME_KEY, value: 'Fabricación bajo pedido: 15 días hábiles' },
      { key: DELIVERY_TIME_KEY, value: '8 días hábiles' },
    ]),
    '8 días hábiles',
  )
})

test('resolveDeliveryTime falls back to the legacy key', () => {
  assert.equal(
    resolveDeliveryTime([
      { key: LEGACY_DELIVERY_TIME_KEY, value: 'Fabricación bajo pedido: 15 días hábiles' },
    ]),
    'Fabricación bajo pedido: 15 días hábiles',
  )
})

test('resolveDeliveryTime returns the default when no config value exists', () => {
  assert.equal(resolveDeliveryTime([]), DEFAULT_DELIVERY_TIME_MESSAGE)
})

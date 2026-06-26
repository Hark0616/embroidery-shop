import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_WHATSAPP_MESSAGE,
  DEFAULT_WHATSAPP_PHONE,
  WHATSAPP_MESSAGE_KEY,
  WHATSAPP_PHONE_KEY,
  buildWhatsAppContactUrl,
  normalizeWhatsAppPhone,
  resolveWhatsAppConfig,
} from '../lib/config/whatsapp'

test('normalizeWhatsAppPhone keeps only digits', () => {
  assert.equal(normalizeWhatsAppPhone('+57 301 373 2290'), '573013732290')
})

test('resolveWhatsAppConfig prefers database config over env fallback', () => {
  const config = resolveWhatsAppConfig([
    { key: WHATSAPP_PHONE_KEY, value: '+57 300 000 0000' },
    { key: WHATSAPP_MESSAGE_KEY, value: 'Hola desde config' },
  ], '573013732290')

  assert.equal(config.phone, '573000000000')
  assert.equal(config.message, 'Hola desde config')
})

test('resolveWhatsAppConfig falls back safely', () => {
  const config = resolveWhatsAppConfig([], null)

  assert.equal(config.phone, DEFAULT_WHATSAPP_PHONE)
  assert.equal(config.message, DEFAULT_WHATSAPP_MESSAGE)
})

test('buildWhatsAppContactUrl uses configured phone and optional base message', () => {
  const url = buildWhatsAppContactUrl('+57 300 000 0000', 'Hola desde config')

  assert.equal(url.startsWith('https://wa.me/573000000000?text='), true)
  assert.equal(decodeURIComponent(url.split('text=')[1] || ''), 'Hola desde config')
})

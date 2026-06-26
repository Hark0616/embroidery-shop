import test from 'node:test'
import assert from 'node:assert/strict'
import { buildShopHref, normalizeShopFilter } from '../lib/shop/filters'

test('normalizeShopFilter keeps URL-safe drop and tag values', () => {
  assert.equal(normalizeShopFilter(' Shonen Energy! '), 'shonenenergy')
  assert.equal(normalizeShopFilter('minimal_negro-01'), 'minimal_negro-01')
})

test('normalizeShopFilter uses the first value when Next provides an array', () => {
  assert.equal(normalizeShopFilter(['Geek', 'Minimal']), 'geek')
})

test('buildShopHref preserves the shop landing when filters are empty', () => {
  assert.equal(buildShopHref({}), '/shop')
})

test('buildShopHref builds stable drop and tag URLs', () => {
  assert.equal(
    buildShopHref({ drop: 'shonen-energy', tag: 'geek' }),
    '/shop?drop=shonen-energy&tag=geek',
  )
})

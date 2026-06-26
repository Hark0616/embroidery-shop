import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DESIGN_MOOD_CATEGORIES,
  MOOD_CATEGORY_MAP,
  getMoodForCategory,
  isMoodCategoryCompatible,
} from '../lib/moods/catalog'

test('admin design categories are compatible with public mood filters', () => {
  for (const category of DESIGN_MOOD_CATEGORIES) {
    assert.equal(isMoodCategoryCompatible(category.value), true)
    assert.equal(MOOD_CATEGORY_MAP[category.mood].includes(category.value), true)
  }
})

test('getMoodForCategory maps admin categories to public moods', () => {
  assert.equal(getMoodForCategory('anime'), 'geek')
  assert.equal(getMoodForCategory('flores'), 'delicado')
  assert.equal(getMoodForCategory('abstracto'), 'minimal')
  assert.equal(getMoodForCategory('legacy-template'), null)
})

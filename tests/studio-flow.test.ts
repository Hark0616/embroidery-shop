import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInitialStudioStep,
  getStepAfterProductSelect,
  shouldPreserveCustomMode,
} from '../lib/studio/flow'

test('custom mode starts by choosing a garment when no product exists', () => {
  assert.equal(
    getInitialStudioStep({
      hasProduct: false,
      hasDesign: false,
      isCustomMode: true,
    }),
    'product',
  )
})

test('custom mode with a product but no uploaded file opens the design step', () => {
  assert.equal(
    getInitialStudioStep({
      hasProduct: true,
      hasDesign: false,
      isCustomMode: true,
    }),
    'design',
  )

  assert.equal(
    getStepAfterProductSelect({
      hasDesign: false,
      isCustomUpload: true,
      hasCustomFile: false,
    }),
    'design',
  )
})

test('custom mode can move to details after a file is selected', () => {
  assert.equal(
    getStepAfterProductSelect({
      hasDesign: false,
      isCustomUpload: true,
      hasCustomFile: true,
    }),
    'details',
  )
})

test('standard catalog design can move to details after garment selection', () => {
  assert.equal(
    getStepAfterProductSelect({
      hasDesign: true,
      isCustomUpload: false,
      hasCustomFile: false,
    }),
    'details',
  )
})

test('product selection preserves custom mode only when no catalog design is selected', () => {
  assert.equal(shouldPreserveCustomMode({ isCustomUpload: true, hasDesign: false }), true)
  assert.equal(shouldPreserveCustomMode({ isCustomUpload: true, hasDesign: true }), false)
  assert.equal(shouldPreserveCustomMode({ isCustomUpload: false, hasDesign: false }), false)
})

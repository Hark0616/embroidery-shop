import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMoodHref } from '../lib/moods'

test('buildMoodHref routes style moods to the design catalog', () => {
  assert.equal(buildMoodHref('rebelde'), '/designs?mood=rebelde')
  assert.equal(buildMoodHref('delicado'), '/designs?mood=delicado')
  assert.equal(buildMoodHref('geek'), '/designs?mood=geek')
  assert.equal(buildMoodHref('tierno'), '/designs?mood=tierno')
  assert.equal(buildMoodHref('minimal'), '/designs?mood=minimal')
})

test('buildMoodHref routes custom mode to the studio upload flow', () => {
  assert.equal(buildMoodHref('custom'), '/studio?custom=true')
})

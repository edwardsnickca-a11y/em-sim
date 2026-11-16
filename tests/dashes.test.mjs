import test from 'node:test'
import assert from 'node:assert/strict'
import { removeEmDashes, labelWithoutDash } from '../src/lib/dashes.js'

test('em dashes and spaced en dashes become ordinary punctuation', () => {
  assert.equal(removeEmDashes('Activation is underway — ESF leads are inbound.'), 'Activation is underway, ESF leads are inbound.')
  assert.equal(removeEmDashes('public messaging—residents'), 'public messaging, residents')
  assert.equal(removeEmDashes('Shelters open – capacity unknown'), 'Shelters open, capacity unknown')
  assert.equal(removeEmDashes('— first\n— second'), 'first\nsecond')
  assert.equal(removeEmDashes('It held — , barely.'), 'It held, barely.')
})

test('number ranges, hyphens, and JSON structure are untouched', () => {
  assert.equal(removeEmDashes('2–5 findings in a well-known EOC'), '2–5 findings in a well-known EOC')
  const raw = '{"consequence":"Okay — here is what came back.","dispatches":["ESF-8 — hospital update"]}'
  const cleaned = removeEmDashes(raw)
  assert.doesNotMatch(cleaned, /—/)
  assert.deepEqual(JSON.parse(cleaned), { consequence: 'Okay, here is what came back.', dispatches: ['ESF-8, hospital update'] })
})

test('labels read as a colon', () => {
  assert.equal(labelWithoutDash('ESF-9 — Search & Rescue'), 'ESF-9: Search & Rescue')
})

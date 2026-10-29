import assert from 'node:assert/strict'
import { factoryCodeMatches } from '../src/lib/verify-factory.ts'
import { FACTORY_RUNTIME_TEMPLATE, FACTORY_IMMUTABLE_RANGES } from '../src/lib/factory-artifact.ts'

assert.equal(factoryCodeMatches(FACTORY_RUNTIME_TEMPLATE), true, 'compiled runtime matches')
let deployed = FACTORY_RUNTIME_TEMPLATE.slice(2)
const token = '3600000000000000000000000000000000000000'.padStart(64, '0')
for (const {start, length} of FACTORY_IMMUTABLE_RANGES) {
  assert.equal(length, 32)
  deployed = deployed.slice(0, start * 2) + token + deployed.slice((start + length) * 2)
}
assert.equal(factoryCodeMatches('0x' + deployed), true, 'compiler-declared immutable token slots accepted')
assert.equal(factoryCodeMatches('0x00' + deployed.slice(2)), false, 'changed executable instruction rejected')
assert.equal(factoryCodeMatches('0x' + deployed.slice(0, -2)), false, 'truncated code rejected')
assert.equal(factoryCodeMatches('0x'), false, 'missing deployment rejected')
assert.equal(factoryCodeMatches('not bytecode'), false, 'malformed response rejected')
console.log('6 factory runtime-verification checks passed')

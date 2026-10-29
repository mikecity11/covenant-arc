import { FACTORY_RUNTIME_TEMPLATE, FACTORY_IMMUTABLE_RANGES } from './factory-artifact.ts'

/** Match every runtime byte except compiler-declared immutable slots. Token is checked separately onchain. */
export function factoryCodeMatches(code: string): boolean {
  if (!/^0x[0-9a-fA-F]+$/.test(code) || code.length !== FACTORY_RUNTIME_TEMPLATE.length) return false
  let actual = code.slice(2).toLowerCase()
  let expected = FACTORY_RUNTIME_TEMPLATE.slice(2).toLowerCase()
  for (const range of FACTORY_IMMUTABLE_RANGES) {
    const start = range.start * 2
    const end = (range.start + range.length) * 2
    actual = actual.slice(0, start) + '0'.repeat(end - start) + actual.slice(end)
    expected = expected.slice(0, start) + '0'.repeat(end - start) + expected.slice(end)
  }
  return actual === expected
}

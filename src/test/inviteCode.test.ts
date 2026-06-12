import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '../lib/inviteCode'

describe('generateInviteCode', () => {
  it('長度為 6', () => {
    expect(generateInviteCode()).toHaveLength(6)
  })

  it('只含無歧義字元（無 0/O/1/I/L）', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateInviteCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('多次產生不重複（機率性）', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode))
    expect(codes.size).toBe(100)
  })
})

import { describe, it, expect } from 'vitest'
import { toTWD } from '../lib/currency'

describe('toTWD', () => {
  const rates = { JPY: 0.22, USD: 32 }

  it('TWD 原樣回傳', () => {
    expect(toTWD(100, 'TWD', rates)).toBe(100)
  })

  it('外幣依匯率換算', () => {
    expect(toTWD(1000, 'JPY', rates)).toBe(220)
  })

  it('結果四捨五入到整數', () => {
    expect(toTWD(999, 'JPY', rates)).toBe(220) // 219.78 → 220
  })

  it('未知幣別丟出錯誤', () => {
    expect(() => toTWD(100, 'EUR', rates)).toThrow('未設定匯率')
  })
})

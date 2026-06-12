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

  it('TWD 非整數也四捨五入', () => {
    expect(toTWD(99.5, 'TWD', rates)).toBe(100)
  })

  it('金額 0 回傳 0', () => {
    expect(toTWD(0, 'JPY', rates)).toBe(0)
  })

  it('負數照算（由 UI 層擋下，函式不設限）', () => {
    expect(toTWD(-500, 'JPY', rates)).toBe(-110)
  })
})

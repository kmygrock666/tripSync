import { describe, it, expect } from 'vitest'
import { computeTotals, computeBalances, simplifyDebts } from '../lib/settlement'
import type { Expense } from '../lib/types'

const rates = { JPY: 0.2 }

function exp(p: Partial<Expense>): Expense {
  return {
    id: 'x', date: '2026-07-01', category: 'food', amount: 0,
    currency: 'TWD', paidBy: 'a', splitWith: ['a', 'b'], note: '',
    createdAt: 0, ...p,
  }
}

describe('computeTotals', () => {
  it('計算每人實付總額（換算 TWD）', () => {
    const expenses = [
      exp({ amount: 300, paidBy: 'a' }),
      exp({ amount: 1000, currency: 'JPY', paidBy: 'b' }), // 200 TWD
    ]
    expect(computeTotals(expenses, rates)).toEqual({ a: 300, b: 200 })
  })
})

describe('computeBalances', () => {
  it('均分：a 付 300 給 a,b 平分 → b 欠 a 150', () => {
    const expenses = [exp({ amount: 300, paidBy: 'a', splitWith: ['a', 'b'] })]
    const bal = computeBalances(expenses, rates)
    expect(bal.a).toBe(150)
    expect(bal.b).toBe(-150)
  })

  it('部分分帳：a 付 200 只算 b 的 → b 欠 a 200', () => {
    const expenses = [exp({ amount: 200, paidBy: 'a', splitWith: ['b'] })]
    const bal = computeBalances(expenses, rates)
    expect(bal.a).toBe(200)
    expect(bal.b).toBe(-200)
  })

  it('除不盡時各人份額四捨五入、付款人吸收差額，總和為 0', () => {
    const expenses = [exp({ amount: 100, paidBy: 'a', splitWith: ['a', 'b', 'c'] })]
    const bal = computeBalances(expenses, rates)
    expect(bal.a + bal.b + bal.c).toBe(0)
    expect(bal.b).toBe(-33)
    expect(bal.c).toBe(-33)
    expect(bal.a).toBe(66)
  })

  it('付款人不在分帳名單且除不盡：總和仍為 0，差額由付款人吸收', () => {
    const expenses = [exp({ amount: 100, paidBy: 'a', splitWith: ['b', 'c', 'd'] })]
    const bal = computeBalances(expenses, rates)
    expect(bal.a + bal.b + bal.c + bal.d).toBe(0)
    expect(bal.a).toBe(99)
  })
})

describe('simplifyDebts', () => {
  it('單一債務', () => {
    expect(simplifyDebts({ a: 150, b: -150 })).toEqual([
      { from: 'b', to: 'a', amount: 150 },
    ])
  })

  it('三人鏈：最大債權配最大債務', () => {
    const transfers = simplifyDebts({ a: 300, b: -100, c: -200 })
    expect(transfers).toEqual([
      { from: 'c', to: 'a', amount: 200 },
      { from: 'b', to: 'a', amount: 100 },
    ])
  })

  it('全部結清回傳空陣列', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([])
  })

  it('四人：兩個債權人兩個債務人', () => {
    const transfers = simplifyDebts({ a: 10, b: 5, c: -10, d: -5 })
    expect(transfers).toEqual([
      { from: 'c', to: 'a', amount: 10 },
      { from: 'd', to: 'b', amount: 5 },
    ])
  })

  it('總和不為 0 時丟出錯誤', () => {
    expect(() => simplifyDebts({ a: 152, b: -150 })).toThrow('do not sum to 0')
  })
})

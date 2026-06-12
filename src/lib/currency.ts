export function toTWD(
  amount: number,
  currency: string,
  rates: Record<string, number>,
): number {
  if (currency === 'TWD') return Math.round(amount)
  const rate = rates[currency]
  if (rate === undefined) throw new Error(`未設定匯率：${currency}`)
  return Math.round(amount * rate)
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // 排除 0/O/1/I/L

export function generateInviteCode(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

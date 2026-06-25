// Convert decimal odds to American moneyline format
export function formatOdds(odds) {
  const o = parseFloat(odds)
  if (isNaN(o) || o <= 1) return String(odds)
  if (o >= 2.0) return `+${Math.round((o - 1) * 100)}`
  return `${Math.round(-100 / (o - 1))}`
}

// Convert American moneyline input (+110, -110) to decimal for Supabase storage
export function americanToDecimal(american) {
  const raw = String(american).trim()
  const a = parseInt(raw, 10)
  if (isNaN(a) || a === 0) return null
  if (a > 0) return parseFloat(((a / 100) + 1).toFixed(4))
  return parseFloat(((100 / Math.abs(a)) + 1).toFixed(4))
}

/** Accepts international formats: digits, spaces, dashes, brackets, leading +. 8–15 digits total. */
export function isValidPhone(value: string): boolean {
  if (!/^\+?[\d\s\-()]+$/.test(value.trim())) return false
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

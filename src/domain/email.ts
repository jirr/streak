const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Vérification volontairement simple : un @, un domaine avec un point, pas d'espace. */
export function isValidEmail(s: string): boolean {
  return s.length <= 254 && EMAIL.test(s)
}

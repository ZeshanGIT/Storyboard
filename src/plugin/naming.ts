/**
 * Naming rules (POC):
 * - screen id `home` → component `Home`, Screens key `Home`
 * - screen id `user-profile` → `UserProfile` (split on `-`, PascalCase segments)
 */
export function screenIdToComponentName(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function screenIdToScreensKey(id: string): string {
  return screenIdToComponentName(id)
}

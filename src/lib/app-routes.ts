export const PLAYGROUND_APP_PATH = '/playground'

export function isPlaygroundAppPath(appPath: string): boolean {
  return appPath === PLAYGROUND_APP_PATH || appPath.startsWith(`${PLAYGROUND_APP_PATH}/`)
}

export function screenRoutePath(routePrefix: string, screenId: string): string {
  return routePrefix ? `${routePrefix}/${screenId}` : `/${screenId}`
}

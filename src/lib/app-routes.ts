export const MDX_APP_PREFIX = '/mdx'
export const PLAYGROUND_APP_PATH = '/playground'

export const SHELL_VIEWS = ['preview', 'prototype', 'graph'] as const
export type ShellView = (typeof SHELL_VIEWS)[number]

export const PLAYGROUND_SOURCES = ['mdx', 'json'] as const
export type PlaygroundSource = (typeof PLAYGROUND_SOURCES)[number]

export const GRAPH_MODES = ['screen', 'compact'] as const
export type GraphMode = (typeof GRAPH_MODES)[number]

export function isPlaygroundAppPath(appPath: string): boolean {
  return appPath === PLAYGROUND_APP_PATH || appPath.startsWith(`${PLAYGROUND_APP_PATH}/`)
}

export function screenRoutePath(routePrefix: string, screenId: string): string {
  return routePrefix ? `${routePrefix}/${screenId}` : `/${screenId}`
}

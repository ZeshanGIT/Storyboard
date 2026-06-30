import {
  GRAPH_MODES,
  type GraphMode,
  MDX_APP_PREFIX,
  PLAYGROUND_APP_PATH,
  PLAYGROUND_SOURCES,
  type PlaygroundSource,
  SHELL_VIEWS,
  type ShellView,
  screenRoutePath,
} from './app-routes'

export type AppMode = 'mdx' | 'playground'

export type AppUrlState = {
  app: AppMode
  source?: PlaygroundSource
  docSlug: string
  view: ShellView
  screenId?: string
  graphMode?: GraphMode
  graphFocus?: string
}

export type ParseAppUrlInput = {
  appPath: string
  search?: string
}

function parseGraphQuery(
  search: string | undefined,
): Pick<AppUrlState, 'graphMode' | 'graphFocus'> {
  if (!search) return {}
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const graphModeRaw = params.get('graphMode')
  const graphMode =
    graphModeRaw && (GRAPH_MODES as readonly string[]).includes(graphModeRaw)
      ? (graphModeRaw as GraphMode)
      : undefined
  const graphFocus = params.get('focus') ?? undefined
  return { ...(graphMode ? { graphMode } : {}), ...(graphFocus ? { graphFocus } : {}) }
}

function isShellView(value: string): value is ShellView {
  return (SHELL_VIEWS as readonly string[]).includes(value)
}

function isPlaygroundSource(value: string): value is PlaygroundSource {
  return (PLAYGROUND_SOURCES as readonly string[]).includes(value)
}

export function parseAppUrl(input: ParseAppUrlInput): AppUrlState | null {
  const segments = input.appPath.split('/').filter(Boolean)
  const graphQuery = parseGraphQuery(input.search)

  if (segments[0] === 'mdx' && segments.length >= 3) {
    const docSlug = segments[1]
    const viewRaw = segments[2]
    if (!docSlug || !isShellView(viewRaw)) return null
    const screenId = viewRaw === 'prototype' ? segments[3] : undefined
    if (viewRaw === 'prototype' && segments.length > 4) return null
    if (viewRaw !== 'prototype' && segments.length > 3) return null
    return {
      app: 'mdx',
      docSlug,
      view: viewRaw,
      ...(screenId ? { screenId } : {}),
      ...(viewRaw === 'graph' ? graphQuery : {}),
    }
  }

  if (segments[0] === 'playground' && segments.length >= 4) {
    const sourceRaw = segments[1]
    const docSlug = segments[2]
    const viewRaw = segments[3]
    if (!isPlaygroundSource(sourceRaw) || !docSlug || !isShellView(viewRaw)) return null
    const screenId = viewRaw === 'prototype' ? segments[4] : undefined
    if (viewRaw === 'prototype' && segments.length > 5) return null
    if (viewRaw !== 'prototype' && segments.length > 4) return null
    return {
      app: 'playground',
      source: sourceRaw,
      docSlug,
      view: viewRaw,
      ...(screenId ? { screenId } : {}),
      ...(viewRaw === 'graph' ? graphQuery : {}),
    }
  }

  return null
}

export function buildAppUrl(state: AppUrlState): { appPath: string; search: string } {
  const base =
    state.app === 'mdx'
      ? `${MDX_APP_PREFIX}/${state.docSlug}/${state.view}`
      : `${PLAYGROUND_APP_PATH}/${state.source}/${state.docSlug}/${state.view}`

  const appPath = state.view === 'prototype' && state.screenId ? `${base}/${state.screenId}` : base

  const params = new URLSearchParams()
  if (state.view === 'graph') {
    if (state.graphMode) params.set('graphMode', state.graphMode)
    if (state.graphFocus) params.set('focus', state.graphFocus)
  }
  const search = params.toString()
  return { appPath, search: search ? `?${search}` : '' }
}

export function screenPathForDoc(
  app: AppMode,
  source: PlaygroundSource | undefined,
  docSlug: string,
  screenId: string,
): string {
  if (app === 'mdx') {
    return screenRoutePath(`${MDX_APP_PREFIX}/${docSlug}`, screenId)
  }
  return screenRoutePath(`${PLAYGROUND_APP_PATH}/${source}/${docSlug}`, screenId)
}

export function resolveLegacyAppPath(
  appPath: string,
  knownDocs: readonly { slug: string; screenIds: readonly string[] }[],
): AppUrlState | null {
  const segments = appPath.split('/').filter(Boolean)

  if (appPath === '/' || appPath === '') {
    const storyboard = knownDocs.find((doc) => doc.slug === 'storyboard')
    const fallback = storyboard ?? knownDocs[0]
    if (!fallback) return null
    return { app: 'mdx', docSlug: fallback.slug, view: 'preview' }
  }

  if (segments[0] === 'playground' && segments.length === 2) {
    const screenId = segments[1]
    const doc = knownDocs.find((entry) => entry.screenIds.includes(screenId))
    if (!doc) return null
    return {
      app: 'playground',
      source: 'json',
      docSlug: doc.slug,
      view: 'prototype',
      screenId,
    }
  }

  if (segments.length === 1) {
    const screenId = segments[0]
    for (const doc of knownDocs) {
      if (doc.screenIds.includes(screenId)) {
        return { app: 'mdx', docSlug: doc.slug, view: 'prototype', screenId }
      }
    }
  }

  if (appPath === PLAYGROUND_APP_PATH) {
    const doc = knownDocs[0]
    const entryScreen = doc?.screenIds[0]
    if (!doc || !entryScreen) return null
    return {
      app: 'playground',
      source: 'json',
      docSlug: doc.slug,
      view: 'prototype',
      screenId: entryScreen,
    }
  }

  return null
}

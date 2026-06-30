import type {
  MdxDocument,
  MdxScreen,
  NavigationEdge,
  NavigationGraph,
  NavigationGraphNode,
} from './types'

function buildNodes(screens: readonly MdxScreen[]): readonly NavigationGraphNode[] {
  return screens.map((screen, index) => ({
    id: screen.id,
    title: screen.title,
    note: screen.note,
    order: screen.order,
    isEntry: index === 0,
  }))
}

function buildEdges(screens: readonly MdxScreen[]): NavigationEdge[] {
  const edges: NavigationEdge[] = []

  for (const screen of screens) {
    for (const link of screen.links) {
      if (link.classification !== 'screen-edge') continue
      if (!link.linkId || !link.toScreenId) continue

      edges.push({
        id: `${link.linkId}->${link.toScreenId}`,
        fromScreenId: screen.id,
        toScreenId: link.toScreenId,
        linkId: link.linkId,
        ...(link.label !== undefined ? { label: link.label } : {}),
      })
    }
  }

  return edges
}

export function extractNavigationGraphFromScreens(screens: readonly MdxScreen[]): NavigationGraph {
  return {
    nodes: buildNodes(screens),
    edges: buildEdges(screens),
  }
}

export function extractNavigationGraph(document: MdxDocument): NavigationGraph {
  return extractNavigationGraphFromScreens(document.screens)
}

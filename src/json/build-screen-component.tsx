import { type ComponentType, Fragment } from 'react'
import { Screen } from '@/components/wireframe'
import type { JsonScreenBuilt } from './build-json-document'
import { jsonNodeKey } from './node-key'
import { buildLinkIdsByTraversal, createRenderContext, renderJsonNode } from './render-json-node'

export function buildScreenComponent(screen: JsonScreenBuilt): ComponentType {
  return function JsonScreen() {
    const ctx = createRenderContext(buildLinkIdsByTraversal(screen.links))

    return (
      <Screen id={screen.id} title={screen.title} note={screen.note}>
        {screen.nodes.map((node, index) => (
          <Fragment key={jsonNodeKey(node, index)}>{renderJsonNode(node, ctx)}</Fragment>
        ))}
      </Screen>
    )
  }
}

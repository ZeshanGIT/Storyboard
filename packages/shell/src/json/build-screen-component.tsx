import { Screen } from '@shell/components/wireframe'
import { type ComponentType, Fragment } from 'react'
import type { JsonScreenBuilt } from './build-json-document'
import { jsonNodeKey } from './node-key'
import { JSON_RENDER_CONTEXT, renderJsonNode } from './render-json-node'

export function buildScreenComponent(screen: JsonScreenBuilt): ComponentType {
  return function JsonScreen() {
    return (
      <Screen id={screen.id} title={screen.title} note={screen.note}>
        {screen.nodes.map((node, index) => (
          <Fragment key={jsonNodeKey(node, index)}>
            {renderJsonNode(node, JSON_RENDER_CONTEXT)}
          </Fragment>
        ))}
      </Screen>
    )
  }
}

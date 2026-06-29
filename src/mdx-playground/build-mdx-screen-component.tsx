import type { ComponentType } from 'react'
import { injectGraphLinkIdsFromClassification } from '@/plugin/inject-graph-link-ids'
import type { MdxScreen } from '@/plugin/types'
import { renderMdxScreenJsx } from './render-mdx-node'

export function buildMdxScreenComponent(screen: MdxScreen): ComponentType {
  const jsx = injectGraphLinkIdsFromClassification(screen.jsx, screen.links)

  return function MdxPlaygroundScreen() {
    return <>{renderMdxScreenJsx(jsx)}</>
  }
}

import { injectGraphLinkIdsFromClassification, type MdxScreen } from '@storyboard/shell'
import type { ComponentType } from 'react'
import { renderMdxScreenJsx } from './render-mdx-node'

export function buildMdxScreenComponent(screen: MdxScreen): ComponentType {
  const jsx = injectGraphLinkIdsFromClassification(screen.jsx, screen.links)

  return function MdxPlaygroundScreen() {
    return <>{renderMdxScreenJsx(jsx)}</>
  }
}

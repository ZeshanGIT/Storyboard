import type { ComponentType } from 'react'

export type RouteEntry = {
  id: string
  path: string
  component: ComponentType
  modalIds?: readonly string[]
}

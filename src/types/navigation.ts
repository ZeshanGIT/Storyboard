export type NavigationEdge = {
  id: string
  fromScreenId: string
  toScreenId: string
  linkId: string
  label?: string
}

export type NavigationGraphNode = {
  id: string
  title: string
  note?: string
  order: number
  isEntry: boolean
}

export type NavigationGraph = {
  nodes: readonly NavigationGraphNode[]
  edges: readonly NavigationEdge[]
}

import type { NavigationGraph } from '../plugin/types'
import { getCodegenErrors } from '../runtime/codegen-error'
import type { RouteEntry } from './router'

export type GraphViewProps = {
  navigationGraph: NavigationGraph
  routes: readonly RouteEntry[]
  documentFilename: string
}

export function GraphView({ navigationGraph, routes, documentFilename }: GraphViewProps) {
  const codegenErrors = getCodegenErrors()

  if (codegenErrors.length > 0) {
    return (
      <p className="text-red-900">
        Graph unavailable until codegen errors in <code>{documentFilename}</code> are fixed.
      </p>
    )
  }

  if (routes.length === 0) {
    return <p className="text-muted-foreground">No screens in {documentFilename}.</p>
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {navigationGraph.nodes.length} screens, {navigationGraph.edges.length} connections
      </p>
      <div className="flex-1 rounded-md border border-border bg-muted/20" />
    </div>
  )
}

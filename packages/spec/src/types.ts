export type StructuralReqId = `SR-${string}`
export type BehavioralReqId = `BR-${string}`
export type ReqPath = { parentId: BehavioralReqId; segments: readonly string[] }

export type ReqDefinition = {
  description: string
  children?: Readonly<Record<string, ReqDefinition>>
}

export type RequirementsFile = {
  structural: Readonly<Record<string, ReqDefinition>>
  behavioral: Readonly<Record<string, ReqDefinition>>
}

export type Binding = readonly [screenId: string, srId?: StructuralReqId]
export type BindingsFile = Readonly<Record<string, readonly Binding[]>>

export type ProductSpec = {
  onespecDir: string
  wireframe: WireframeSpec
  requirements: RequirementsFile
  bindings: BindingsFile
}

export type WireframeSpec = {
  title: string
  screens: Readonly<Record<string, WireframeScreenSpec>>
}

export type WireframeScreenSpec = {
  sr?: StructuralReqId
  title?: string
  note?: string
  nodes: unknown[]
}

export type ValidationIssue = {
  code: string
  message: string
  severity: 'error' | 'warning'
}

export type ValidationResult = {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export type ImpactResult = {
  target: string
  bindings: readonly { brId: BehavioralReqId; placements: readonly Binding[] }[]
  screens?: readonly string[]
  srs?: readonly StructuralReqId[]
}

export type TraceMatch = {
  file: string
  line: number
  column: number
  text: string
}

export type TraceResult = {
  target: string
  matches: readonly TraceMatch[]
}

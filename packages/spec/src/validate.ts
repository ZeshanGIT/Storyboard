import { collectSrIds, listScreenIds } from './collect-sr-ids.js'
import { isNamedChildKey, isNumericChildKey, parseReqPath } from './sr-id.js'
import type {
  ProductSpec,
  ReqDefinition,
  RequirementsFile,
  StructuralReqId,
  ValidationIssue,
  ValidationResult,
  WireframeSpec,
} from './types.js'

function isLocalBrId(id: string): boolean {
  return /^BR-[0-9]+$/.test(id)
}

function collectSrIdsForScreen(wireframe: WireframeSpec, screenId: string) {
  const screen = wireframe.screens[screenId]
  if (!screen) return new Set<string>()
  return collectSrIds({ title: wireframe.title, screens: { [screenId]: screen } })
}

function resolveBrDefinition(
  requirements: RequirementsFile,
  parentId: string,
  segments: readonly string[],
): ReqDefinition | undefined {
  const root = requirements.behavioral[parentId]
  if (!root) return undefined
  let current: ReqDefinition = root
  for (const segment of segments) {
    if (!current.children || !(segment in current.children)) {
      return undefined
    }
    current = current.children[segment]
  }
  return current
}

function validateBrChildKeys(requirements: RequirementsFile, issues: ValidationIssue[]): void {
  for (const [brId, def] of Object.entries(requirements.behavioral)) {
    validateBrChildKeysAt(requirements, brId, def, [], issues)
  }
}

function validateBrChildKeysAt(
  requirements: RequirementsFile,
  brId: string,
  def: ReqDefinition,
  segments: readonly string[],
  issues: ValidationIssue[],
): void {
  if (!def.children) return
  const local = isLocalBrId(brId)
  const pathPrefix = segments.length === 0 ? brId : `${brId}/${segments.join('/')}`
  for (const [key, child] of Object.entries(def.children)) {
    if (local && !isNumericChildKey(key)) {
      issues.push({
        code: 'BR_CHILD_KEY',
        severity: 'error',
        message: `Local BR ${pathPrefix} child key must be numeric, got "${key}"`,
      })
    }
    if (!local && !isNamedChildKey(key)) {
      issues.push({
        code: 'BR_CHILD_KEY',
        severity: 'error',
        message: `Shared BR ${pathPrefix} child key must be named slug, got "${key}"`,
      })
    }
    validateBrChildKeysAt(requirements, brId, child, [...segments, key], issues)
  }
}

function validateBrChildPaths(requirements: RequirementsFile, issues: ValidationIssue[]): void {
  for (const [brId, def] of Object.entries(requirements.behavioral)) {
    walkBrChildPaths(brId, def, [], requirements, issues)
  }
}

function walkBrChildPaths(
  brId: string,
  def: ReqDefinition,
  segments: readonly string[],
  requirements: RequirementsFile,
  issues: ValidationIssue[],
): void {
  if (!def.children) return
  const parent = resolveBrDefinition(requirements, brId, segments)
  if (!parent?.children) return
  for (const key of Object.keys(def.children)) {
    if (!(key in parent.children)) {
      const path =
        segments.length === 0 ? `${brId}/${key}` : `${brId}/${[...segments, key].join('/')}`
      issues.push({
        code: 'BR_INVALID_CHILD_PATH',
        severity: 'error',
        message: `Child path ${path} references missing parent key "${key}"`,
      })
      continue
    }
    walkBrChildPaths(brId, def.children[key], [...segments, key], requirements, issues)
  }
}

function validateBindingPaths(spec: ProductSpec, issues: ValidationIssue[]): void {
  for (const key of Object.keys(spec.bindings)) {
    if (!key.includes('/')) continue
    try {
      const { parentId, segments } = parseReqPath(key)
      if (resolveBrDefinition(spec.requirements, parentId, segments) === undefined) {
        issues.push({
          code: 'BR_INVALID_CHILD_PATH',
          severity: 'error',
          message: `Child path ${key} references invalid parent keys`,
        })
      }
    } catch {
      issues.push({
        code: 'BR_INVALID_CHILD_PATH',
        severity: 'error',
        message: `Invalid behavioral req path: ${key}`,
      })
    }
  }
}

function validateSrReferences(
  spec: ProductSpec,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const specSrIds = collectSrIds(spec.wireframe)
  const definedSrIds = new Set(Object.keys(spec.requirements.structural))

  for (const srId of specSrIds) {
    if (!definedSrIds.has(srId)) {
      errors.push({
        code: 'SR_MISSING_DEFINITION',
        severity: 'error',
        message: `SR ${srId} appears in spec but has no definition in requirements.structural`,
      })
    }
  }

  for (const srId of definedSrIds) {
    if (!specSrIds.has(srId as StructuralReqId)) {
      warnings.push({
        code: 'SR_UNUSED',
        severity: 'warning',
        message: `SR ${srId} is defined in requirements.structural but does not appear in spec`,
      })
    }
  }
}

function validateBindings(spec: ProductSpec, errors: ValidationIssue[]): void {
  const screenIds = listScreenIds(spec.wireframe)
  const behavioral = spec.requirements.behavioral

  for (const [brId, placements] of Object.entries(spec.bindings)) {
    if (!(brId in behavioral)) {
      errors.push({
        code: 'BR_MISSING_DEFINITION',
        severity: 'error',
        message: `BR ${brId} in bindings has no definition in requirements.behavioral`,
      })
    }

    for (const [screenId, srId] of placements) {
      if (!screenIds.has(screenId)) {
        errors.push({
          code: 'BINDING_SCREEN_UNKNOWN',
          severity: 'error',
          message: `Binding for ${brId} references unknown screen "${screenId}"`,
        })
        continue
      }

      if (srId === undefined) continue

      const screenSrIds = collectSrIdsForScreen(spec.wireframe, screenId)
      if (!screenSrIds.has(srId)) {
        errors.push({
          code: 'BINDING_SR_NOT_ON_SCREEN',
          severity: 'error',
          message: `Binding for ${brId} references SR ${srId} which is not on screen "${screenId}"`,
        })
      }
    }
  }
}

export function validateProductSpec(spec: ProductSpec): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  validateSrReferences(spec, errors, warnings)
  validateBindings(spec, errors)
  validateBrChildKeys(spec.requirements, errors)
  validateBrChildPaths(spec.requirements, errors)
  validateBindingPaths(spec, errors)

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

export type MeasuredScreenNodeSize = {
  width: number
  height: number
}

export type ScreenNodeSizeMap = ReadonlyMap<string, MeasuredScreenNodeSize>

export function normalizeMeasuredSize(rect: {
  width: number
  height: number
}): MeasuredScreenNodeSize {
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height)),
  }
}

export function isScreenMeasurementComplete(
  expectedScreenIds: readonly string[],
  sizes: ScreenNodeSizeMap,
): boolean {
  return expectedScreenIds.every((id) => sizes.has(id))
}

import { wireframePluginState } from '../plugin/plugin-state'

export function CodegenErrorBanner() {
  const error = wireframePluginState.lastError
  if (!error) return null

  return (
    <div role="alert" className="border border-red-600 bg-red-50 px-4 py-3 text-red-900">
      <strong>Wireframe codegen error:</strong> {error.message}
    </div>
  )
}

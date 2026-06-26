import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

type WireframeErrorOverlayProps = {
  errors: readonly string[]
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

type CopyButtonProps = {
  label: string
  copied: boolean
  onCopy: () => void
}

function CopyButton({ label, copied, onCopy }: CopyButtonProps) {
  return (
    <button
      type="button"
      className="shrink-0 rounded border border-red-600 p-1"
      aria-label={label}
      title={label}
      onClick={onCopy}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
    </button>
  )
}

export function WireframeErrorOverlay({ errors }: WireframeErrorOverlayProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (errors.length === 0) return null

  async function handleCopy(text: string, key: string) {
    const copied = await copyText(text)
    if (!copied) return
    setCopiedKey(key)
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current))
    }, 1500)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 max-w-md max-h-[40vh] overflow-y-auto rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="font-semibold">Wireframe error</strong>
        <CopyButton
          label="Copy all errors"
          copied={copiedKey === 'all'}
          onCopy={() => handleCopy(errors.join('\n'), 'all')}
        />
      </div>

      <ul className="mt-2 space-y-2">
        {errors.map((error) => (
          <li key={error} className="flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <CopyButton
              label={`Copy error: ${error}`}
              copied={copiedKey === error}
              onCopy={() => handleCopy(error, error)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0"
      aria-label={label}
      title={label}
      onClick={onCopy}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
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
    <div className="fixed bottom-4 right-4 z-50 max-w-md max-h-[40vh] overflow-y-auto">
      <Alert variant="destructive">
        <AlertTitle className="flex items-center justify-between gap-3">
          Wireframe error
          <CopyButton
            label="Copy all errors"
            copied={copiedKey === 'all'}
            onCopy={() => handleCopy(errors.join('\n'), 'all')}
          />
        </AlertTitle>
        <AlertDescription>
          <ul className="mt-2 flex flex-col gap-2">
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
        </AlertDescription>
      </Alert>
    </div>
  )
}

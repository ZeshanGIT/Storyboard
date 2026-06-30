import type { PlaygroundSource } from '@onespec-dev/shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PlaygroundSourceTabsProps = {
  source: PlaygroundSource
  onSourceChange: (next: PlaygroundSource) => void
}

const SOURCES: readonly PlaygroundSource[] = ['json', 'mdx']

export function PlaygroundSourceTabs({ source, onSourceChange }: PlaygroundSourceTabsProps) {
  return (
    <div className="inline-flex h-7 items-center gap-0.5 rounded-none bg-muted p-0.5">
      {SOURCES.map((value) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            'h-6 rounded-none px-2 uppercase',
            source === value && 'bg-background text-foreground shadow-sm',
          )}
          aria-pressed={source === value}
          onClick={() => {
            if (value !== source) onSourceChange(value)
          }}
        >
          {value}
        </Button>
      ))}
    </div>
  )
}

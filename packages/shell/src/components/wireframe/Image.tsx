import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type ImageAspect = 'square' | 'portrait' | 'landscape' | 'wide'

export type ImageProps = NoteProps & {
  aspect?: ImageAspect
  disabled?: boolean
  danger?: boolean
}

const aspectClass: Record<ImageAspect, string> = {
  square: 'aspect-square max-w-48',
  portrait: 'aspect-[3/4] max-w-48',
  landscape: 'aspect-[4/3] w-full',
  wide: 'aspect-[21/9] w-full',
}

export function Image({ aspect = 'landscape', disabled, danger, note }: ImageProps) {
  return (
    <WireframeNote note={note}>
      <div
        role="img"
        aria-label="Image placeholder"
        className={cn(
          'flex items-center justify-center border border-dashed border-border bg-muted/30 text-xs text-muted-foreground',
          aspectClass[aspect],
          wireframeAffordanceClass(disabled, danger),
        )}
      >
        Image
      </div>
    </WireframeNote>
  )
}

import { Loader2 } from 'lucide-react'

export function GraphLoadingState() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">Laying out graph</span>
    </div>
  )
}

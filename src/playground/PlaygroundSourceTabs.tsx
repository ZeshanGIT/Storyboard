import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlaygroundSource } from '@/lib/app-routes'

export type PlaygroundSourceTabsProps = {
  source: PlaygroundSource
  onSourceChange: (next: PlaygroundSource) => void
}

export function PlaygroundSourceTabs({ source, onSourceChange }: PlaygroundSourceTabsProps) {
  return (
    <Tabs value={source} onValueChange={(value) => onSourceChange(value as PlaygroundSource)}>
      <TabsList className="h-7">
        <TabsTrigger value="json" className="px-2 text-xs">
          JSON
        </TabsTrigger>
        <TabsTrigger value="mdx" className="px-2 text-xs">
          MDX
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

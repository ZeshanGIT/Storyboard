import { useWireframeDisplayPreferences } from '@shell/runtime/WireframeDisplayPreferences'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function IndicatorToggles() {
  const { showLinkIndicators, showNoteIndicators, setShowLinkIndicators, setShowNoteIndicators } =
    useWireframeDisplayPreferences()

  return (
    <div className="flex items-center gap-4">
      <Label className="text-muted-foreground">
        <Switch
          size="sm"
          checked={showLinkIndicators}
          onCheckedChange={setShowLinkIndicators}
          aria-label="Show link indicators"
        />
        Links
      </Label>
      <Label className="text-muted-foreground">
        <Switch
          size="sm"
          checked={showNoteIndicators}
          onCheckedChange={setShowNoteIndicators}
          aria-label="Show note indicators"
        />
        Notes
      </Label>
    </div>
  )
}

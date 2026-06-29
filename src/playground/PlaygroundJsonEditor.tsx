import Editor from '@monaco-editor/react'
import './monaco-setup'

export type PlaygroundJsonEditorProps = {
  value: string
  onChange: (next: string) => void
}

export function PlaygroundJsonEditor({ value, onChange }: PlaygroundJsonEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-muted/30">
      <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        JSON
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="json"
          theme="vs"
          value={value}
          onChange={(next) => onChange(next ?? '')}
          options={{
            automaticLayout: true,
            fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
          }}
          loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        />
      </div>
    </div>
  )
}

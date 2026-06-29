import Editor from '@monaco-editor/react'
import type { ReactNode } from 'react'
import { asEditorText } from './editor-text'
import './monaco-setup'

export type PlaygroundMonacoEditorProps = {
  label: string
  language: string
  value: string
  onChange: (next: string) => void
  headerExtra?: ReactNode
}

export function PlaygroundMonacoEditor({
  label,
  language,
  value,
  onChange,
  headerExtra,
}: PlaygroundMonacoEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {headerExtra}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs"
          value={asEditorText(value)}
          onChange={(next) => onChange(asEditorText(next))}
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

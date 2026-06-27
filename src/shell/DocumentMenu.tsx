import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ContentDocumentEntry } from '../generated/content-documents.generated'

export type DocumentMenuProps = {
  documents: readonly ContentDocumentEntry[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export function DocumentMenu({ documents, activeSlug, onSelect }: DocumentMenuProps) {
  const [open, setOpen] = useState(false)
  const activeTitle = documents.find((doc) => doc.slug === activeSlug)?.title ?? 'Documents'

  const select = (slug: string) => {
    onSelect(slug)
    setOpen(false)
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open documents"
          onClick={() => setOpen((value) => !value)}
        >
          <Menu />
        </Button>
        <h1 className="truncate text-lg font-semibold tracking-tight">{activeTitle}</h1>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close document menu"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav
        aria-label="MDX documents"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background shadow-lg transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Documents</p>
        </div>
        <ul className="flex flex-col gap-1 p-2">
          {documents.map((doc) => {
            const isActive = doc.slug === activeSlug
            return (
              <li key={doc.slug}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => select(doc.slug)}
                >
                  {doc.title}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

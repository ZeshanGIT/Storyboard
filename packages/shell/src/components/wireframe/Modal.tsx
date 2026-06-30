import { useWireframeView } from '@shell/runtime/WireframeViewContext'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type ModalProps = NoteProps & {
  id: string
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}

export function Modal({ id, disabled, danger, note, children }: ModalProps) {
  const { view, activeModalId, closeModal } = useWireframeView()
  const open = view === 'prototype' && activeModalId === id

  if (view === 'preview') {
    return (
      <WireframeNote note={note}>
        <div
          className={cn(
            'mt-4 border border-dashed border-border p-4',
            wireframeAffordanceClass(disabled, danger),
          )}
          data-modal-id={id}
        >
          <p className="mb-2 text-xs text-muted-foreground">Modal: {id}</p>
          {children}
        </div>
      </WireframeNote>
    )
  }

  return (
    <>
      {note ? (
        <WireframeNote note={note} className="h-0 self-end overflow-visible">
          <span className="sr-only">Modal: {id}</span>
        </WireframeNote>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeModal()
        }}
      >
        <DialogContent showCloseButton className={wireframeAffordanceClass(disabled, danger)}>
          <DialogTitle className="sr-only">Modal {id}</DialogTitle>
          <DialogDescription className="sr-only">Wireframe modal {id}</DialogDescription>
          <div className="flex flex-col gap-4">{children}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}

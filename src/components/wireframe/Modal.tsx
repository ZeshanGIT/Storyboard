import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useWireframeView } from '@/runtime/WireframeViewContext'
import { wireframeAffordanceClass } from './affordances'

export type ModalProps = {
  id: string
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}

export function Modal({ id, disabled, danger, children }: ModalProps) {
  const { view, activeModalId, closeModal, registerModal } = useWireframeView()
  const open = view === 'prototype' && activeModalId === id

  useEffect(() => registerModal(id), [id, registerModal])

  if (view === 'preview') {
    return (
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
    )
  }

  return (
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
  )
}

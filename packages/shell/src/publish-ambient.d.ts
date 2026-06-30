/// <reference types="vite/client" />

/** Ambient stubs for OSS shadcn imports; runtime resolved via Vite aliases until Phase 5 vendoring. */
declare module '@/lib/utils' {
  export function cn(...inputs: unknown[]): string
}

type ShadcnComponent = import('react').ComponentType<Record<string, unknown>>

declare module '@/components/ui/alert' {
  export const Alert: ShadcnComponent
  export const AlertTitle: ShadcnComponent
  export const AlertDescription: ShadcnComponent
}

declare module '@/components/ui/badge' {
  export const Badge: ShadcnComponent
}

declare module '@/components/ui/button' {
  export const Button: ShadcnComponent
}

declare module '@/components/ui/checkbox' {
  export const Checkbox: ShadcnComponent
}

declare module '@/components/ui/dialog' {
  export const Dialog: ShadcnComponent
  export const DialogContent: ShadcnComponent
  export const DialogDescription: ShadcnComponent
  export const DialogTitle: ShadcnComponent
}

declare module '@/components/ui/field' {
  export const Field: ShadcnComponent
  export const FieldDescription: ShadcnComponent
  export const FieldError: ShadcnComponent
  export const FieldLabel: ShadcnComponent
}

declare module '@/components/ui/input' {
  export const Input: ShadcnComponent
}

declare module '@/components/ui/label' {
  export const Label: ShadcnComponent
}

declare module '@/components/ui/radio-group' {
  export const RadioGroup: ShadcnComponent
  export const RadioGroupItem: ShadcnComponent
}

declare module '@/components/ui/select' {
  export const Select: ShadcnComponent
  export const SelectContent: ShadcnComponent
  export const SelectGroup: ShadcnComponent
  export const SelectItem: ShadcnComponent
  export const SelectTrigger: ShadcnComponent
  export const SelectValue: ShadcnComponent
}

declare module '@/components/ui/separator' {
  export const Separator: ShadcnComponent
}

declare module '@/components/ui/switch' {
  export const Switch: ShadcnComponent
}

declare module '@/components/ui/tabs' {
  export const Tabs: ShadcnComponent
  export const TabsList: ShadcnComponent
  export const TabsTrigger: ShadcnComponent
}

declare module '@/components/ui/textarea' {
  export const Textarea: ShadcnComponent
}

declare module '@/components/ui/tooltip' {
  export const Tooltip: ShadcnComponent
  export const TooltipContent: ShadcnComponent
  export const TooltipProvider: ShadcnComponent
  export const TooltipTrigger: ShadcnComponent
}

declare module 'virtual:wireframe-codegen-state' {
  export type CodegenErrorInfo = {
    code: string
    message: string
    screenId: string | null
  }

  export const codegenErrors: readonly CodegenErrorInfo[]
  export const codegenError: CodegenErrorInfo | null
}

declare module '*.css' {
  const css: string
  export default css
}

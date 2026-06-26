import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type InputProps = {
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
}

export function Input({ label, type = 'text', placeholder }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ShadcnInput type={type} placeholder={placeholder} readOnly disabled />
    </div>
  )
}

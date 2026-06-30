import { Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type InputType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'select'
  | 'search'
  | 'number'
  | 'date'

export type InputProps = NoteProps & {
  type?: InputType
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  defaultValue?: string
  options?: readonly string[]
  disabled?: boolean
  danger?: boolean
}

function RequiredMark() {
  return <span className="text-destructive"> *</span>
}

function InputControl({
  type = 'text',
  label,
  placeholder,
  hint,
  error,
  required,
  defaultValue,
  options,
  disabled,
  danger,
}: Omit<InputProps, 'note'>) {
  const optionList = options ?? []
  const invalid = Boolean(error)
  const helperText = error ?? hint

  if (type === 'checkbox') {
    return (
      <Field
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        className={wireframeAffordanceClass(disabled, danger)}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            defaultChecked={defaultValue === 'true'}
            disabled={disabled}
            aria-invalid={invalid}
          />
          {label ? (
            <Label>
              {label}
              {required ? <RequiredMark /> : null}
            </Label>
          ) : null}
        </div>
        {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    )
  }

  if (type === 'toggle') {
    return (
      <Field
        orientation="horizontal"
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        className={wireframeAffordanceClass(disabled, danger)}
      >
        {label ? (
          <FieldLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
        ) : null}
        <Switch
          defaultChecked={defaultValue === 'true'}
          disabled={disabled}
          aria-invalid={invalid}
        />
        {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    )
  }

  if (type === 'radio') {
    return (
      <Field
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        className={wireframeAffordanceClass(disabled, danger)}
      >
        {label ? (
          <FieldLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
        ) : null}
        <RadioGroup defaultValue={defaultValue} disabled={disabled} aria-invalid={invalid}>
          {optionList.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} id={`radio-${option}`} />
              <Label htmlFor={`radio-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    )
  }

  if (type === 'select') {
    return (
      <Field
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        className={wireframeAffordanceClass(disabled, danger)}
      >
        {label ? (
          <FieldLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
        ) : null}
        <Select defaultValue={defaultValue} disabled={disabled}>
          <SelectTrigger className="w-full" aria-invalid={invalid}>
            <SelectValue placeholder={placeholder ?? 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {optionList.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    )
  }

  if (type === 'textarea') {
    return (
      <Field
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        className={wireframeAffordanceClass(disabled, danger)}
      >
        {label ? (
          <FieldLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
        ) : null}
        <Textarea
          placeholder={placeholder}
          defaultValue={defaultValue}
          readOnly
          disabled={disabled}
          aria-invalid={invalid}
        />
        {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    )
  }

  const htmlType = type === 'search' ? 'search' : type

  return (
    <Field
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      className={wireframeAffordanceClass(disabled, danger)}
    >
      {label ? (
        <FieldLabel>
          {label}
          {required ? <RequiredMark /> : null}
        </FieldLabel>
      ) : null}
      <div className={cn('relative', type === 'search' && 'flex items-center')}>
        {type === 'search' ? (
          <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
        ) : null}
        <ShadcnInput
          type={htmlType}
          placeholder={placeholder}
          defaultValue={defaultValue}
          readOnly
          disabled={disabled}
          aria-invalid={invalid}
          className={type === 'search' ? 'pl-8' : undefined}
        />
      </div>
      {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

export function Input({ note, ...props }: InputProps) {
  return (
    <WireframeNote note={note}>
      <InputControl {...props} />
    </WireframeNote>
  )
}

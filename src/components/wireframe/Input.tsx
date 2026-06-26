export type InputProps = {
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
}

export function Input({ label, type = 'text', placeholder }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        readOnly
        disabled
        className="border border-current px-2 py-1"
      />
    </label>
  )
}

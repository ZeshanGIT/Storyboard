import type { ReactNode } from 'react'

export type ListProps = {
  children: ReactNode
}

export type ListItemProps = {
  children: ReactNode
}

export function List({ children }: ListProps) {
  return <ul className="flex flex-col gap-1 list-disc pl-5 text-sm">{children}</ul>
}

export function ListItem({ children }: ListItemProps) {
  return <li>{children}</li>
}

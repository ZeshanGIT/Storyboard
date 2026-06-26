import type { ReactNode } from 'react'

export type ListProps = {
  children: ReactNode
}

export type ListItemProps = {
  children: ReactNode
}

export function List({ children }: ListProps) {
  return <ul className="list-disc pl-5 flex flex-col gap-1">{children}</ul>
}

export function ListItem({ children }: ListItemProps) {
  return <li>{children}</li>
}

import { JsonBuildError } from './types'

export const WIREFRAME_COMPONENTS = [
  'Text',
  'Link',
  'Input',
  'Container',
  'Image',
  'Icon',
  'Modal',
  'TopBar',
  'Divider',
] as const

export type WireframeComponent = (typeof WIREFRAME_COMPONENTS)[number]

const GLOBAL_MODIFIERS = new Set(['disabled', 'danger', 'required'])

const COMPONENT_MODIFIERS: Record<WireframeComponent, readonly string[]> = {
  Text: ['h1', 'h2', 'h3', 'h4'],
  Link: ['primary-btn', 'secondary-btn'],
  Input: [
    'text',
    'password',
    'textarea',
    'checkbox',
    'radio',
    'toggle',
    'select',
    'search',
    'number',
    'date',
  ],
  Container: ['row', 'border'],
  Image: ['square', 'portrait', 'landscape', 'wide'],
  Icon: ['sm', 'md', 'lg'],
  Modal: [],
  TopBar: ['showBack'],
  Divider: [],
}

const ONE_OF_GROUPS: Record<WireframeComponent, readonly (readonly string[])[]> = {
  Text: [['h1', 'h2', 'h3', 'h4']],
  Link: [['primary-btn', 'secondary-btn']],
  Input: [
    [
      'text',
      'password',
      'textarea',
      'checkbox',
      'radio',
      'toggle',
      'select',
      'search',
      'number',
      'date',
    ],
  ],
  Image: [['square', 'portrait', 'landscape', 'wide']],
  Icon: [['sm', 'md', 'lg']],
  Container: [],
  Modal: [],
  TopBar: [],
  Divider: [],
}

function isWireframeComponent(name: string): name is WireframeComponent {
  return (WIREFRAME_COMPONENTS as readonly string[]).includes(name)
}

export function validateModifiers(component: string, modifiers: readonly string[]): void {
  if (!isWireframeComponent(component)) {
    throw new JsonBuildError('INVALID_NODE', `Unknown component "${component}"`)
  }

  const allowed = new Set([...COMPONENT_MODIFIERS[component], ...GLOBAL_MODIFIERS])
  for (const modifier of modifiers) {
    if (!allowed.has(modifier)) {
      throw new JsonBuildError(
        'INVALID_NODE',
        `Unknown modifier "${modifier}" for component "${component}"`,
      )
    }
  }

  for (const group of ONE_OF_GROUPS[component]) {
    const matched = modifiers.filter((m) => group.includes(m))
    if (matched.length > 1) {
      throw new JsonBuildError(
        'INVALID_NODE',
        `Conflicting modifiers for "${component}": ${matched.join(', ')}`,
      )
    }
  }
}

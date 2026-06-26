import { Screen, Text, Link } from './components/wireframe'

const components = {
  Screen,
  Text,
  Link,
}

declare global {
  type MDXProvidedComponents = typeof components
}

export function useMDXComponents(): MDXProvidedComponents {
  return components
}

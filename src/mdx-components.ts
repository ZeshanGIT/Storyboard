import {
  Button,
  Card,
  Heading,
  Input,
  Link,
  List,
  ListItem,
  Screen,
  Section,
  Separator,
  Text,
} from './components/wireframe'

const components = {
  Screen,
  Text,
  Link,
  Heading,
  Input,
  Button,
  Section,
  Card,
  List,
  ListItem,
  Separator,
}

declare global {
  type MDXProvidedComponents = typeof components
}

export function useMDXComponents(): MDXProvidedComponents {
  return components
}

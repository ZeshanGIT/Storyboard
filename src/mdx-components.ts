import {
  Container,
  Divider,
  Icon,
  Image,
  Input,
  Link,
  Modal,
  Screen,
  Text,
  TopBar,
} from '@onespec-dev/shell'

const components = {
  Screen,
  Text,
  Link,
  Input,
  Container,
  Image,
  Icon,
  Modal,
  TopBar,
  Divider,
}

declare global {
  type MDXProvidedComponents = typeof components
}

export function useMDXComponents(): MDXProvidedComponents {
  return components
}

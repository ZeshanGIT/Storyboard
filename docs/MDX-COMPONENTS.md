# MDX Wireframe Components

Reference for components available in `src/content/wireframe.mdx` without imports. Registered in [`src/mdx-components.ts`](../src/mdx-components.ts).

Wireframe components express **product intent** — structure, hierarchy, and navigation — not visual design. Use double quotes for string props. Use bare flags for booleans (`required`, `primary-btn`, `showBack`).

Full specification: [`wireframe-component-spec-updated.md`](wireframe-component-spec-updated.md).

---

## Authoring basics

### Screen IDs and navigation

- Each `<Screen>` needs a unique `id` (pattern: `^[a-zA-Z][a-zA-Z0-9_-]*$`).
- `<Modal>` ids are unique **within each screen** and must not match any Screen id. The same Modal id may be reused on different screens.
- `goto` to a Modal id resolves only to modals declared in the **current** screen.
- Navigation uses `<Link goto="…">` or type-safe `goto={Screens.Login}` from generated `screens-map.generated.ts`.
- Reserved `goto` values: `_close` (dismiss open modal), `_back` (browser back / previous screen).
- First `<Screen>` in the file is the prototype entry screen.

### Global boolean props

All components except `Screen` accept optional bare flags:

| Prop | Effect |
|------|--------|
| `disabled` | Non-interactive; reduced opacity |
| `danger` | Destructive affordance |

### Self-closing components

No children: `<Input … />`, `<Image … />`, `<Icon … />`, `<Divider … />`.

---

## Components

### `Screen`

Root container for one application screen.

| Prop | Required | Description |
|------|----------|-------------|
| `id` | Yes | Unique screen identifier; `goto` target |
| `title` | No | Optional label shown in MDX Preview only |

```mdx
<Screen id="home" title="Home">
  <Text variant="h1">Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
</Screen>
```

---

### `Link`

Clickable navigation. Wraps text or other components (e.g. bordered `Container`).

| Prop | Required | Description |
|------|----------|-------------|
| `goto` | Yes | Screen id, Modal id, `_close`, or `_back` |
| `primary-btn` | No | Primary button appearance |
| `secondary-btn` | No | Secondary button appearance |
| `disabled` | No | Non-interactive |
| `danger` | No | Destructive affordance |

Without `primary-btn` / `secondary-btn`, renders as an inline text link. `danger` combines with button variants.

```mdx
<Link goto="dashboard">Go to Dashboard</Link>
<Link goto={Screens.Signup} primary-btn>Create Account</Link>
<Link goto="confirmDelete" danger secondary-btn>Delete</Link>

<Link goto="projectDetail">
  <Container border>
    <Text variant="h3">Project Alpha</Text>
    <Text>Last updated yesterday</Text>
  </Container>
</Link>
```

---

### `Text`

Headings, body copy, labels, captions. **Text children only** — no nested components.

| Prop | Required | Description |
|------|----------|-------------|
| `variant` | No | `h1`, `h2`, `h3`, `h4`, `body` (default) |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

```mdx
<Text variant="h1">Dashboard</Text>
<Text variant="h2">Recent Projects</Text>
<Text>You have 3 pending tasks.</Text>
<Text danger>This action cannot be undone.</Text>
```

---

### `Input`

Form control placeholder. Self-closing. Read-only in Prototype View.

| Prop | Required | Default | Description |
|------|----------|---------|-------------|
| `type` | No | `text` | See supported types below |
| `label` | No | — | Field label |
| `placeholder` | No | — | Empty-state placeholder |
| `hint` | No | — | Helper text below control |
| `error` | No | — | Error message; overrides `hint` |
| `required` | No | — | Shows required indicator on label |
| `defaultValue` | No | — | Pre-filled value in prototype |
| `options` | No | — | Comma-separated list for `select` / `radio` |
| `disabled` | No | — | Non-interactive |
| `danger` | No | — | Danger affordance |

**Supported `type` values:**

| Type | Renders as |
|------|------------|
| `text` | Single-line text field |
| `password` | Obscured text field |
| `textarea` | Multi-line field |
| `checkbox` | Checkbox with label |
| `radio` | Radio group (`options` required) |
| `toggle` | Switch |
| `select` | Dropdown (`options` required) |
| `search` | Search field with icon |
| `number` | Numeric input |
| `date` | Date input placeholder |

```mdx
<Input label="Email" placeholder="you@example.com" required />
<Input label="Password" type="password" hint="At least 8 characters" required />
<Input label="Role" type="select" options="Admin, Editor, Viewer" />
<Input label="Notifications" type="toggle" defaultValue="true" />
<Input label="Bio" type="textarea" />
<Input label="Username" error="Already taken" />
```

---

### `Container`

Layout container. Column by default; replaces separate Card / Row / Column patterns.

| Prop | Required | Description |
|------|----------|-------------|
| `row` | No | Horizontal layout |
| `border` | No | Visible bounding box (card-like) |
| `distribute` | No | Main-axis distribution when `row`: `start`, `space-between`, `space-around`, `end` |
| `align` | No | Cross-axis alignment: `start`, `center`, `end` |
| `disabled` | No | Disabled affordance on container |
| `danger` | No | Danger affordance |

```mdx
<Container>
  <Input label="First name" />
  <Input label="Last name" />
  <Link goto="save" primary-btn>Save</Link>
</Container>

<Container row distribute="space-between">
  <Text variant="h2">Projects</Text>
  <Link goto="newProject" secondary-btn>New Project</Link>
</Container>

<Container border>
  <Text variant="h3">Terms</Text>
  <Text>By continuing you agree to our terms.</Text>
</Container>
```

---

### `Image`

Image placeholder. Self-closing.

| Prop | Required | Description |
|------|----------|-------------|
| `aspect` | No | `square`, `portrait`, `landscape` (default), `wide` |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

```mdx
<Image aspect="wide" />
<Image aspect="square" />
<Image />
```

---

### `Icon`

Named [Lucide](https://lucide.dev/icons/) icon. Self-closing. Use kebab-case names (`bell`, `trash-2`, `chevron-right`).

| Prop | Required | Description |
|------|----------|-------------|
| `name` | Yes | Lucide icon name |
| `size` | No | `sm`, `md` (default), `lg` |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

```mdx
<Icon name="bell" />
<Icon name="settings" size="sm" />
<Link goto="notifications"><Icon name="bell" /></Link>
```

---

### `Modal`

Overlay dialog. Declare inside a `Screen`. Opens when a `Link` `goto` matches the modal `id`. Dismiss via backdrop, Escape, or `<Link goto="_close">`.

| Prop | Required | Description |
|------|----------|-------------|
| `id` | Yes | Unique within this screen; must not match any Screen id. May repeat across screens. |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

Use `<Text variant="h2">` for the heading. Always include a cancel action.

```mdx
<Link goto="deleteConfirm" danger secondary-btn>Delete Project</Link>

<Modal id="deleteConfirm">
  <Text variant="h2">Delete project?</Text>
  <Text danger>This cannot be undone.</Text>
  <Container row>
    <Link goto="_close" secondary-btn>Cancel</Link>
    <Link goto="dashboard" danger primary-btn>Delete</Link>
  </Container>
</Modal>
```

---

### `TopBar`

Screen header. Usually first child of `Screen`.

| Prop | Required | Description |
|------|----------|-------------|
| `title` | No | App or section title |
| `showBack` | No | Back control (`_back`) |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

Children layout horizontally — typically `Link` + `Icon` actions.

```mdx
<TopBar title="MyApp" showBack>
  <Link goto="notifications"><Icon name="bell" /></Link>
  <Link goto="settings"><Icon name="settings" /></Link>
</TopBar>
```

---

### `Divider`

Horizontal separator. Self-closing.

| Prop | Required | Description |
|------|----------|-------------|
| `label` | No | Text inset in rule (e.g. `"or"`) |
| `disabled` | No | Disabled affordance |
| `danger` | No | Danger affordance |

```mdx
<Divider />
<Divider label="or" />
```

---

## Nesting rules

| Parent | Disallowed children |
|--------|---------------------|
| `Screen` | `Screen` |
| `Modal` | `Screen`, `Modal`, `TopBar` |
| `TopBar` | `Screen`, `Modal`, `TopBar`, `Container`, `Input` |
| `Link` | `Screen`, `TopBar`, `Modal`, `Link` |
| `Container` | `Screen`, `TopBar` |
| `Text` | Any component (plain text only) |
| `Image`, `Icon`, `Input`, `Divider` | Any (self-closing) |

---

## Type-safe screen references

Codegen emits `Screens` from screen ids:

```mdx
import { Screens } from '../generated/screens-map.generated'

<Link goto={Screens.Login}>Login</Link>
```

Id `login` → `Screens.Login`. Invalid keys fail at codegen.

---

## Quick reference

| Component | Purpose |
|-----------|---------|
| `Screen` | Navigable screen root |
| `Link` | Navigation and actions |
| `Text` | Copy and headings |
| `Input` | Form fields |
| `Container` | Layout / grouping |
| `Image` | Image placeholder |
| `Icon` | Lucide icon |
| `Modal` | Overlay dialog |
| `TopBar` | Screen header |
| `Divider` | Section separator |

# Wireframe Component Library — Specification

## Overview

Components are authored in MDX and parsed to produce:

- **Prototype View** — Interactive wireframe with functional navigation and modals.
- **Documentation View** — Human-readable screen-by-screen spec.
- **Graph View** — Directed graph of screen-to-screen navigation.
- **Validation** — Structural errors and broken link diagnostics.

Components communicate product intent, information hierarchy, and user interactions.
They do not communicate colors, pixel spacing, typography, or visual polish.
The renderer uses a simple wireframe style.

---

## Authoring Rules

- Components are JSX-style tags inside MDX files.
- String props use double quotes. Boolean props are bare flags: `<Link primary-btn>`.
- Self-closing tags have no children: `<Divider />`, `<Image />`, `<Icon />`, `<Input />`.
- `Screen` ids must be globally unique.
- `Modal` ids must be unique within each screen and must not match any Screen id. The same Modal id may be used on different screens.
- `goto` must resolve to a Screen id, a Modal id declared in the current screen, or a reserved destination.
- Reserved destinations: `_close` (closes the open Modal), `_back` (previous screen).
- All components except `Screen` support `disabled` and `danger` as bare boolean props.
- Unknown props are flagged as warnings by the validator.

---

## Components

---

### Screen

Root container for a single application screen. The first Screen in the document is the initial screen.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `id` | Yes | Globally unique screen identifier. Used as `goto` target. Pattern: `/^[a-zA-Z][a-zA-Z0-9_-]*$/`. |

**Validation:**
- Error: missing or duplicate `id`.
- Warning: no children; never referenced by any `goto`.

```mdx
<Screen id="dashboard">
  ...
</Screen>
```

---

### Link

Clickable element that navigates to a Screen, opens a Modal, or triggers a reserved destination. Wraps arbitrary content. Renders as plain text by default; use variant flags for button appearances.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `goto` | Yes | Target Screen id, Modal id, or reserved destination (`_close`, `_back`). |
| `primary-btn` | No | Renders as a primary button. |
| `secondary-btn` | No | Renders as a secondary button. |
| `disabled` | No | Non-interactive. Renders with a disabled affordance. |
| `danger` | No | Communicates a destructive action. Rendered with a danger affordance. |

`danger` and `primary-btn` / `secondary-btn` may be combined.
Without a button variant, Link renders inline like text with a clickable affordance.

**Validation:**
- Error: missing `goto`; `goto` does not resolve.
- Warning: empty children.
- Warning: `primary-btn` and `secondary-btn` both present.

```mdx
<Link goto="dashboard">Go to Dashboard</Link>

<Link goto="signup" primary-btn>Create Account</Link>

<Link goto="confirmDelete" danger secondary-btn>Delete</Link>

<Link goto="projectDetail">
  <Container border>
    <Text>Project Alpha</Text>
    <Text>Last updated yesterday</Text>
  </Container>
</Link>
```

---

### Text

Displays a block of text. Used for headings, body copy, labels, and captions.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `variant` | No | `h1`, `h2`, `h3`, `h4`, `body` (default). Communicates heading level and hierarchy to the renderer. |
| `disabled` | No | Rendered with a disabled affordance (reduced opacity). |
| `danger` | No | Rendered with a danger affordance. |

**Validation:**
- Warning: empty or whitespace-only children.
- Error: non-text child nodes.

```mdx
<Text variant="h1">Dashboard</Text>
<Text variant="h2">Recent Projects</Text>
<Text>You have 3 pending tasks.</Text>
<Text danger>This action cannot be undone.</Text>
```

---

### Input

A user input control. Self-closing.

**Props:**

| Prop | Required | Default | Description |
|------|----------|---------|-------------|
| `type` | No | `text` | Control type. See supported types below. |
| `label` | No | — | Label displayed alongside the control. |
| `placeholder` | No | — | Placeholder shown when the control is empty. |
| `hint` | No | — | Helper text shown below the control. |
| `error` | No | — | Inline error message. Puts the control in an error state. Overrides `hint`. |
| `required` | No | — | Marks the field as required with a visual indicator. |
| `defaultValue` | No | — | Pre-filled value shown in Prototype View. |
| `options` | No | — | Comma-separated options for `select` and `radio` types. |
| `disabled` | No | — | Non-interactive. |
| `danger` | No | — | Danger affordance. |

**Supported types:**

| Type | Renders as |
|------|-----------|
| `text` | Single-line text field (default) |
| `password` | Obscured single-line field |
| `textarea` | Multi-line text field |
| `checkbox` | Checkbox with label |
| `radio` | Radio group (requires `options`) |
| `toggle` | Toggle/switch |
| `select` | Dropdown (requires `options`) |
| `search` | Search field with icon affordance |
| `number` | Numeric input |
| `date` | Date picker (rendered as placeholder) |

**Validation:**
- Error: unsupported `type` value.
- Warning: `select` or `radio` without `options`.

```mdx
<Input label="Email" placeholder="you@example.com" required />
<Input label="Password" type="password" hint="At least 8 characters" required />
<Input label="Role" type="select" options="Admin, Editor, Viewer" />
<Input label="Notifications" type="toggle" defaultValue="true" />
<Input label="Bio" type="textarea" />
<Input label="Username" error="Already taken" />
```

---

### Container

General-purpose layout container. Column by default. Replaces Card, Row, and Column.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `row` | No | Lays out children horizontally instead of vertically. |
| `border` | No | Renders a visible bounding box around children (Card-equivalent). |
| `distribute` | No | Main-axis distribution. Only valid with `row`. Values: `start` (default), `space-between`, `space-around`, `end`. |
| `align` | No | Cross-axis alignment. Values: `start` (default), `center`, `end`. |
| `disabled` | No | Disabled affordance applied to the container and its children. |
| `danger` | No | Danger affordance. |

**Validation:**
- Warning: `distribute` used without `row`.
- Warning: empty children.

```mdx
{/* Vertical stack (default) */}
<Container>
  <Input label="First name" />
  <Input label="Last name" />
  <Link goto="save" primary-btn>Save</Link>
</Container>

{/* Horizontal row */}
<Container row distribute="space-between">
  <Text variant="h2">Projects</Text>
  <Link goto="newProject" secondary-btn>New Project</Link>
</Container>

{/* Card-equivalent */}
<Link goto="projectDetail">
  <Container border>
    <Text variant="h3">Project Alpha</Text>
    <Text>Last updated yesterday</Text>
  </Container>
</Link>

{/* Row of cards */}
<Container row>
  <Container border>
    <Text>Option A</Text>
  </Container>
  <Container border>
    <Text>Option B</Text>
  </Container>
</Container>
```

---

### Image

An image placeholder. Self-closing.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `aspect` | No | Intended aspect ratio hint for the renderer. Values: `square`, `portrait`, `landscape` (default), `wide`. |
| `disabled` | No | Disabled affordance. |
| `danger` | No | Danger affordance. |

```mdx
<Image aspect="wide" />
<Image aspect="square" />
<Image />
```

---

### Icon

A named icon from the [Lucide](https://lucide.dev/icons/) icon set. Self-closing.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `name` | Yes | Lucide icon name (kebab-case). Examples: `bell`, `trash-2`, `chevron-right`, `user`, `settings`, `search`, `plus`, `x`, `check`, `triangle-alert`, `lock`, `house`, `pencil`, `upload`. See lucide.dev for the full list. |
| `size` | No | `sm`, `md` (default), `lg`. |
| `disabled` | No | Disabled affordance. |
| `danger` | No | Danger affordance. |

**Validation:**
- Error: missing `name`.

```mdx
<Icon name="bell" />
<Icon name="trash-2" danger />
<Icon name="settings" size="sm" />
```

---

### Modal

An overlay dialog. Declared anywhere inside a Screen. Opened when a Link's `goto` matches the Modal's `id`. Always dismissible by clicking the backdrop or pressing Escape.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `id` | Yes | Unique within this screen. Must not match any Screen id. May repeat across screens. Referenced by `goto` in the same screen to open this modal. |
| `disabled` | No | Disabled affordance. |
| `danger` | No | Danger affordance. |

Use `Text` for the modal heading. Use a `Link goto="_close"` to provide an explicit dismiss action.

**Validation:**
- Error: missing or duplicate `id`.
- Warning: no `Link` with `goto="_close"` present; no children.

```mdx
{/* Trigger */}
<Link goto="deleteConfirm" danger secondary-btn>Delete Project</Link>

{/* Modal declaration (anywhere in the same Screen) */}
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

### TopBar

Primary navigation header. Intended as the first child of a Screen.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `title` | No | App or section name, displayed in the bar. |
| `showBack` | No | Renders a back affordance that triggers `_back`. |
| `disabled` | No | Disabled affordance. |
| `danger` | No | Danger affordance. |

Children are laid out horizontally. Typically `Link` and `Icon` elements for navigation actions.

**Validation:**
- Warning: no children and no `title`; more than one TopBar in a Screen.

```mdx
<TopBar title="MyApp" showBack>
  <Link goto="notifications"><Icon name="bell" /></Link>
  <Link goto="settings"><Icon name="settings" /></Link>
</TopBar>
```

---

### Divider

A horizontal visual separator. Self-closing.

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `label` | No | Text label inset into the rule (e.g. `"or"`). |
| `disabled` | No | Disabled affordance. |
| `danger` | No | Danger affordance. |

```mdx
<Divider />
<Divider label="or" />
```

---

## Nesting Rules

| Parent | Disallowed children |
|--------|-------------------|
| `Screen` | `Screen` |
| `Modal` | `Screen`, `Modal`, `TopBar` |
| `TopBar` | `Screen`, `Modal`, `TopBar`, `Container`, `Input` |
| `Link` | `Screen`, `TopBar`, `Modal`, `Link` |
| `Container` | `Screen`, `TopBar` |
| `Text` | Any component (plain text string only) |
| `Image`, `Icon`, `Input`, `Divider` | Any (self-closing) |

---

## Validation Summary

**Errors:**
- `Screen` or `Modal` missing `id`
- Duplicate `Screen` id
- Duplicate `Modal` id within the same screen
- `Modal` id matches a `Screen` id
- `goto` does not resolve to a known Screen id, a Modal id in the current screen, or a reserved destination
- `Input` has an unsupported `type`
- `Icon` missing `name`
- Component appears where disallowed by nesting rules

**Warnings:**
- `Screen` has no children or is never referenced by any `goto`
- `Modal` has no `Link goto="_close"`; has no children
- `Input` of type `select` or `radio` missing `options`
- `TopBar` has no children and no `title`; more than one TopBar per Screen
- `Container` uses `distribute` without `row`
- `Link` has both `primary-btn` and `secondary-btn`
- Any container component (Screen, Modal, Container, TopBar) has empty children

---

## Full Example

```mdx
<Screen id="login" title="Login">
  <TopBar title="MyApp" />
  <Container>
    <Text variant="h1">Sign in</Text>
    <Input label="Email" placeholder="you@example.com" required />
    <Input label="Password" type="password" required />
    <Input label="Remember me" type="checkbox" />
    <Link goto="dashboard" primary-btn>Sign In</Link>
    <Divider label="or" />
    <Link goto="signup">Create an account</Link>
  </Container>
</Screen>

<Screen id="signup" title="Sign Up">
  <TopBar title="MyApp" showBack />
  <Container>
    <Text variant="h1">Create your account</Text>
    <Container row>
      <Input label="First name" required />
      <Input label="Last name" required />
    </Container>
    <Input label="Email" required />
    <Input label="Password" type="password" hint="At least 8 characters" required />
    <Input label="I agree to the Terms of Service" type="checkbox" required />
    <Link goto="dashboard" primary-btn>Create Account</Link>
  </Container>
</Screen>

<Screen id="dashboard">
  <TopBar title="MyApp">
    <Link goto="notifications"><Icon name="bell" /></Link>
    <Link goto="settings"><Icon name="settings" /></Link>
  </TopBar>
  <Container row distribute="space-between">
    <Text variant="h1">Your Projects</Text>
    <Link goto="newProject" secondary-btn>New Project</Link>
  </Container>
  <Container row>
    <Link goto="projectDetail">
      <Container border>
        <Text variant="h3">Project Alpha</Text>
        <Text>Last updated yesterday</Text>
      </Container>
    </Link>
    <Link goto="projectDetail">
      <Container border>
        <Text variant="h3">Project Beta</Text>
        <Text>Last updated 3 days ago</Text>
      </Container>
    </Link>
  </Container>
</Screen>

<Screen id="projectDetail" title="Project Detail">
  <TopBar title="Project Alpha" showBack />
  <Image alt="Project cover" aspect="wide" />
  <Text variant="h1">Project Alpha</Text>
  <Text>A description of what this project is about.</Text>
  <Divider />
  <Container row distribute="space-between">
    <Link goto="editProject" secondary-btn>Edit</Link>
    <Link goto="deleteConfirm" danger secondary-btn>Delete</Link>
  </Container>

  <Modal id="deleteConfirm">
    <Text variant="h2">Delete project?</Text>
    <Text danger>This will permanently delete Project Alpha and all its data.</Text>
    <Container row>
      <Link goto="_close" secondary-btn>Cancel</Link>
      <Link goto="dashboard" danger primary-btn>Delete</Link>
    </Container>
  </Modal>
</Screen>

<Screen id="settings" title="Settings">
  <TopBar title="Settings" showBack />
  <Container>
    <Text variant="h2">Notifications</Text>
    <Input label="Email notifications" type="toggle" defaultValue="true" />
    <Input label="Push notifications" type="toggle" />
    <Divider />
    <Text variant="h2">Account</Text>
    <Input label="Display name" />
    <Input label="Language" type="select" options="English, French, Spanish, German" />
    <Link goto="dashboard" primary-btn>Save Changes</Link>
    <Divider />
    <Link goto="login" danger secondary-btn>Sign Out</Link>
  </Container>
</Screen>

<Screen id="notifications" title="Notifications">
  <TopBar title="Notifications" showBack />
  <Container>
    <Container border>
      <Container row>
        <Icon name="check" />
        <Text>Project Alpha was updated</Text>
      </Container>
      <Text>2 hours ago</Text>
    </Container>
    <Container border>
      <Container row>
        <Icon name="triangle-alert" />
        <Text>Build failed on Project Beta</Text>
      </Container>
      <Text>Yesterday</Text>
    </Container>
  </Container>
</Screen>
```

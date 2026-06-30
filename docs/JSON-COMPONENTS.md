# JSON Wireframe Spec

**Agent reference** — browser/SaaS path. Tuple nodes + colon-modifier tags. Parallels [`MDX-COMPONENTS.md`](MDX-COMPONENTS.md); same primitives, same nav rules.

Props = data only (strings, ids, arrays). Flags and enum variants = tag modifiers. Omit empty `{}`.

## Document

```json
{
  "title": "My App",
  "screens": {
    "home": {
      "title": "Home",
      "note": "optional screen annotation",
      "nodes": []
    }
  }
}
```

- `title` (req) — document label.
- `screens` (req) — object keyed by screen `id`.
- First key in `screens` (object insertion order) = prototype/graph entry.
- Per screen: `title` (preview label), optional `note`, `nodes` (req).

## Node tuples

```
[tag]                          leaf, no props
[tag, props]                   leaf with props
[tag, text]                    text leaf (Text, Link label)
[tag, props, text]             text leaf with props
[tag, props, children]         container; children = node[] or string
[tag, children]                container, no props
```

### Structural requirements (SR)

Optional 2nd tuple element when traceable — see [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md).

[tag, sr] | [tag, sr, props] | [tag, sr, text] | [tag, sr, props, text] | [tag, sr, children] | [tag, sr, props, children]

`sr` matches `^SR-`. Layout nodes (`Container:row`) typically omit SR.

**Tag:** `Component` or `Component:modifier:modifier…`

- **Component** — PascalCase primitive name.
- **modifier** — bare flag or enum variant (order-independent).
- Parse: `tag.split(":")` → component + modifiers.

Global modifiers (any component): `disabled` `danger`. Global prop: `note` (string).

Leaf-only (no children): `Input` `Image` `Icon` `Divider`.

## Rules

- Screen keys unique across document.
- `Modal` `id` unique per screen; must not match a screen key.
- `Link` prop `goto` → screen key | modal `id` on **current** screen | `_close` | `_back`
- `Text` text child = plain string only (no nested nodes).

## Components

### Screen

Not a tuple — document entry in `screens`.

Props: `title` (preview label), `note`, `nodes` (req).

### `Text`

Modifiers: `h1` `h2` `h3` `h4` — one max; default body.

```json
["Text:h1", "Welcome back"]
["Text", {"note": "…"}, "Body copy"]
```

### `Link`

Prop: `goto` (req). Modifiers: `primary-btn` `secondary-btn` — one max; else text link.

```json
["Link:primary-btn", {"goto": "login"}, "Login"]
["Link", {"goto": "settings"}, [["Icon:sm", {"name": "chevron"}], "Settings"]]
```

### `Input`

Type modifiers (one max; default `text`): `text` `password` `textarea` `checkbox` `radio` `toggle` `select` `search` `number` `date`

Props: `label` `placeholder` `hint` `error` (overrides hint) `defaultValue` `options` (req for `radio`/`select`). Modifier: `required`.

```json
["Input:password:required", {"label": "Password", "hint": "8+ characters"}]
["Input:select", {"label": "Role", "options": ["Admin", "Member"]}]
```

### `Container`

Column default. Modifiers: `row` `border`. Props (when `row`): `distribute` (`start` `space-between` `space-around` `end`), `align` (`start` `center` `end`).

```json
["Container:row", {"distribute": "space-between"}, [
  ["Link:primary-btn", {"goto": "a"}, "A"],
  ["Link:secondary-btn", {"goto": "b"}, "B"]
]]
```

### `Image`

Aspect modifiers (one max; default `landscape`): `square` `portrait` `landscape` `wide`

```json
["Image:portrait"]
["Image:wide", {"note": "hero placeholder"}]
```

### `Icon`

Prop: `name` (req, Lucide kebab-case). Size modifiers (one max; default `md`): `sm` `md` `lg`

```json
["Icon:sm", {"name": "bell"}]
```

### `Modal`

Prop: `id` (req). Inside screen `nodes`. Open via `Link goto`. Dismiss: backdrop, Escape, `goto="_close"`.

```json
["Modal", {"id": "confirm"}, [
  ["Text:h2", "Delete project?"],
  ["Link:danger:primary-btn", {"goto": "_close"}, "Cancel"],
  ["Link:primary-btn", {"goto": "dashboard"}, "Confirm"]
]]
```

### `TopBar`

Props: `title`. Modifier: `showBack`. Children: horizontal `Link`, `Icon`.

```json
["TopBar:showBack", {"title": "Workforge"}, [
  ["Icon", {"name": "bell"}],
  ["Icon", {"name": "settings"}]
]]
```

### `Divider`

Prop: `label` optional.

```json
["Divider"]
["Divider", {"label": "or"}]
```

## Example

```json
{
  "title": "Workforge Demo",
  "screens": {
    "home": {
      "title": "Home",
      "nodes": [
        ["Text:h1", "Welcome back"],
        ["Text", "Sign in to continue."],
        ["Container:row", {"distribute": "space-between"}, [
          ["Link:primary-btn", {"goto": "login"}, "Login"],
          ["Link:secondary-btn", {"goto": "signup"}, "Create account"]
        ]]
      ]
    },
    "login": {
      "title": "Login",
      "nodes": [
        ["TopBar:showBack", {"title": "Workforge"}],
        ["Container", [
          ["Text:h1", "Sign in"],
          ["Input:required", {"label": "Email", "placeholder": "you@example.com"}],
          ["Input:password:required", {"label": "Password"}],
          ["Link:primary-btn", {"goto": "dashboard"}, "Sign in"]
        ]]
      ]
    }
  }
}
```

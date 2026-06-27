# MDX Wireframe Components

**Agent reference** — attached on every wireframe build. Keep this file minimal; the API follows the same rule: maximum spec with minimum surface.

No imports. Strings `"quoted"`. Booleans = bare flags. Self-close: `Input` `Image` `Icon` `Divider`. All except `Screen`: `disabled` `danger`.

Only `<Screen>` blocks register for prototype/graph. First `Screen` = entry.

## Rules

- `Screen` `id` unique.
- `Modal` `id` unique per screen; must not match a `Screen` id.
- `Link goto` → screen id | modal id on **current** screen | `_close` | `_back`
- `Text` children = plain text only

## Components

### `Screen`
`id` (req), `title` (preview label only)

### `Link`
`goto` (req). Flags: `primary-btn`, `secondary-btn` — else text link.

### `Text`
Flags: `h1` `h2` `h3` `h4` — one max; default body.

### `Input`
`type` default `text`: `text` `password` `textarea` `checkbox` `radio` `toggle` `select` `search` `number` `date`

Props: `label` `placeholder` `hint` `error` (overrides hint) `required` `defaultValue` `options` (req for `radio`/`select`)

### `Container`
Column default. Flags: `row` `border`. When `row`: `distribute` (`start` `space-between` `space-around` `end`), `align` (`start` `center` `end`)

### `Image`
`aspect`: `square` `portrait` `landscape` (default) `wide`

### `Icon`
`name` (req, Lucide kebab-case). `size`: `sm` `md` `lg`

### `Modal`
`id` (req). Inside `Screen`. Open via `Link goto`. Dismiss: backdrop, Escape, `goto="_close"`.

### `TopBar`
`title`, `showBack`. Children: horizontal actions (`Link`, `Icon`).

### `Divider`
`label` optional

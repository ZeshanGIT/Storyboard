# MDX Wireframe Components

No imports. String props in `"quotes"`. Booleans = bare flags.

**Global flags** (all except `Screen`): `disabled`, `danger`

**Self-closing:** `Input`, `Image`, `Icon`, `Divider`

MDX may also use Tailwind (`className`), custom HTML, CSS, JavaScript, and other React components — not limited to wireframe primitives.

**Screen registration:** Prototype View, Graph View, and nav analysis only see `<Screen>` blocks. Content outside `<Screen>` is ignored by those views. Each registered screen needs a `<Screen>` tag.

## Rules

- `Screen` `id` unique. First `Screen` = entry.
- `Modal` `id` unique per screen; must not match a `Screen` id. Same modal id OK on other screens.
- `Link goto` → screen id | modal id on **current** screen | `_close` | `_back`
- `Text` children = plain text only

## Components

### `Screen`
`id` (req), `title` (preview label only)

### `Link`
`goto` (req). Flags: `primary-btn`, `secondary-btn` — else text link. Wraps children (e.g. `Container`).

### `Text`
Flags: `h1` `h2` `h3` `h4` — one max; default body.

### `Input`
`type` default `text`: `text` `password` `textarea` `checkbox` `radio` `toggle` `select` `search` `number` `date`

Props: `label` `placeholder` `hint` `error` (overrides hint) `required` `defaultValue` `options` (array; req for `radio`/`select`)

### `Container`
Column default. Flags: `row` `border`. When `row`: `distribute` (`start` `space-between` `space-around` `end`), `align` (`start` `center` `end`)

### `Image`
`aspect`: `square` `portrait` `landscape` (default) `wide`

### `Icon`
`name` (req, Lucide kebab-case e.g. `bell` `trash-2`). `size`: `sm` `md` `lg`

### `Modal`
`id` (req). Inside `Screen`. Open via matching `Link goto`. Dismiss: backdrop, Escape, `goto="_close"`. Use `Text h2` + cancel link.

### `TopBar`
`title`, `showBack`. Children laid out horizontally (`Link`, `Icon`).

### `Divider`
`label` optional (e.g. `"or"`)

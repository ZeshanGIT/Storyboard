# MDX Wireframes

**A text-first UX specification format for developers, designers, and AI agents.**

## Problem

Early-stage product teams often have a clear understanding of the product's behavior but lack the time or expertise to produce polished UX designs.

Developers resort to ASCII diagrams, Markdown lists, or screenshots. Designers must reconstruct the intended flows from conversations, tickets, and scattered documentation. AI agents also struggle to reason about images or ad-hoc sketches.

There is currently no equivalent of Mermaid for UI wireframes.

## Vision

MDX Wireframes is a lightweight framework for describing application screens as code.

Instead of drawing interfaces, developers write simple MDX using React components that represent the structure and behavior of a screen.

Example:

```mdx
<Screen id={Screens.Welcome} title="Home">

  <Text>Welcome back</Text>

  <Button goto={Screens.Login}>
    Login
  </Button>

  <Button goto={Screens.Signup}>
    Create Account
  </Button>

</Screen>
```

The goal is not to design the interface.

The goal is to describe:

* What is visible
* What actions are available
* Where actions navigate
* How screens are connected

## Philosophy

This is **not** a replacement for Figma.

It is the product specification that exists before visual design.

Think of it as:

> Storybook for UX flows.

Designers decide *how* something should look.

This tool specifies *what* exists and *how users move through it*.

## Outputs

A single MDX document becomes the source of truth and can generate multiple views.

### Documentation

Readable product documentation.

### Clickable Prototype

A minimal, unstyled prototype where every interactive element can be clicked to navigate between screens.

No colors.

No typography.

No animations.

Just behavior.

### Navigation Graph

Automatically generated graph showing relationships between screens.

```
Home
├── Login
├── Signup
└── About

Login
└── Dashboard
```

### Validation

Static analysis can detect:

* Broken navigation links
* Duplicate screen IDs
* Unreachable screens
* Cyclic navigation (optional)
* Missing destinations

### Reverse References

Each screen can show:

```
Referenced by

- Home
- Password Reset
- Email Verification
```

## Why MDX?

MDX is already:

* Human-readable
* Git-friendly
* AI-friendly
* Extensible through React components
* Easy to version and review

Instead of inventing another DSL, the component library becomes the language.

## Example Components

* `<Screen>`
* `<Button>`
* `<Input>`
* `<Text>`
* `<Card>`
* `<List>`
* `<Modal>`
* `<Dialog>`
* `<BottomNav>`
* `<Tabs>`
* `<Section>`

The components intentionally contain minimal styling.

They express intent rather than appearance.

## Future Ideas

* Automatic Mermaid generation
* Export to Excalidraw
* Export to Figma
* AI-generated screen summaries
* Accessibility checks
* User journey analysis
* Dead-end detection
* Permission-aware navigation
* Generate React page skeletons
* Storybook integration

## Target Users

* Developers designing features before implementation
* Product managers documenting flows
* Designers reviewing product behavior
* AI agents generating or modifying product specifications

## Non-Goals

* Pixel-perfect mockups
* High-fidelity prototyping
* Visual design tooling
* Design system replacement

The framework intentionally stops before visual design begins.

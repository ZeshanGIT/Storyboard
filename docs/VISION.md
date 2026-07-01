# OneSpec Vision

## What is OneSpec?

OneSpec is an AI-first product specification platform that treats the **Product Specification** as the source of truth for an application.

Site: [https://onespec.dev](https://onespec.dev)

Instead of treating the UI as the primary artifact, OneSpec models the product itself—its screens, flows, behaviors, navigation, and requirements—and derives every other representation from that model.

A wireframe is not the product.

A sitemap is not the product.

A UX flow is not the product.

A React application is not the product.

All of these are simply **different projections of the same Product Specification**.

---

## Vision

The long-term vision is to allow anyone to build an application by progressively defining:

1. Product Specification
2. Design System / Design Guides
3. Implementation

The user should never have to manually keep wireframes, UX flows, sitemaps, prototypes, and implementation synchronized.

They should all be generated from the same underlying model.

Ultimately, the workflow becomes:

```
Idea

↓

Product Specification

↓

Design Guide

↓

Interactive Prototype

↓

Application
```

As the Product Specification evolves, every derived artifact evolves with it.

---

## Customer Perspective

From a customer's point of view, OneSpec is extremely simple.

The customer defines:

* Product requirements
* UX flows
* Navigation
* Design guides

OneSpec AI then generates:

* Interactive wireframes
* Prototype
* Graph views
* Sitemap
* Production-ready application

The UI is no longer something the user manually designs.

Instead, it is the product of:

```
Product Specification
        +
Design Guide
        ↓
Generated UI
```

---

## Two Flavors of OneSpec

OneSpec is intended to exist in two complementary products.

### 1. OneSpec Cloud

This is the primary product.

The cloud version is highly opinionated.

It owns the entire workflow.

It provides:

* Product Specification editor
* AI editing
* Built-in wireframe components
* Prototype renderer
* Graph view
* Sitemap
* Code generation
* Opinionated project architecture
* Opinionated Design System
* Opinionated AI workflow

Users generally do not edit generated code directly.

Instead they modify the Product Specification and let AI regenerate the implementation.

Because OneSpec owns the entire lifecycle, the Product Specification remains the authoritative source of truth.

---

### 2. OneSpec OSS / Power User Edition

This version targets developers.

Power users can:

* Use completely custom React components
* Customize the rendering pipeline
* Choose their own architecture
* Integrate OneSpec into existing projects
* Extend the component library
* Ignore the opinionated architecture if they choose

The Product Specification still exists.

However, OneSpec no longer guarantees that implementation remains synchronized because developers are free to modify the code directly.

Instead OneSpec provides diagnostics and tooling that help detect drift.

---

## Product Specification

The Product Specification is the canonical representation of the application.

It describes the application in terms of product concepts rather than implementation.

Examples include:

* Features
* Screens
* Navigation
* User flows
* Structural requirements
* Behavioral requirements

The Product Specification intentionally does **not** describe implementation details.

---

## Structural Requirements

Structural requirements describe what must exist.

Examples:

* Login screen
* Email input
* Password input
* Login button
* Forgot password link

Each structural requirement has a stable identifier.

For example:

```
SR-001
SR-002
SR-003
```

These identifiers are preserved throughout the development lifecycle.

---

## Behavioral Requirements

Behavioral requirements describe how the application behaves.

Examples:

* Authenticate when Login is pressed
* Show validation errors
* Disable Login while authenticating
* Show Billing only for Pro users
* Navigate to Dashboard after successful login

Behavioral requirements also receive stable identifiers.

For example:

```
BR-001
BR-002
BR-003
```

Behavioral requirements describe observable product behavior.

They intentionally do not prescribe implementation.

---

## Traceability

One of OneSpec's core goals is maintaining traceability between:

* Product Specification
* UI
* Implementation
* Tests

Every structural and behavioral requirement should be traceable throughout the development lifecycle.

---

### Structural Traceability

Wireframe elements reference structural requirements.

Example:

```
<Input />

// represents SR-001
```

This allows OneSpec to determine:

* which requirements are implemented
* which requirements are missing
* which UI elements correspond to each requirement

---

### Behavioral Traceability

Behavior is intentionally treated differently.

A behavioral requirement is not mapped to a specific function.

Real implementations usually span multiple files and multiple functions.

Instead OneSpec uses lightweight implementation annotations.

Example:

```ts
// @sb-req: BR-001
```

These annotations act as implementation entry points.

They are not intended to prove correctness.

Instead they allow:

* AI to immediately locate relevant implementation
* Developers to navigate from specification to code
* Tooling to index implementation locations

Because the annotation lives with the implementation, it naturally survives most refactoring.

---

## Tests as Verification

Comments provide navigation.

Tests provide verification.

Behavioral requirements should ideally have corresponding automated tests.

Example:

```
BR-001

↓

Implementation

↓

Test
```

A passing test is considered evidence that the required behavior exists.

This separates:

* Navigation
* Verification

rather than trying to combine them.

---

## Opinionated Architecture

OneSpec Cloud intentionally generates applications using a consistent architecture.

This architecture exists primarily to make AI significantly more effective.

It defines:

* Folder structure
* Feature organization
* Design conventions
* Testing conventions
* Traceability conventions
* Component organization

Supporting documentation such as:

* SKILL.md
* DESIGN.md
* ARCHITECTURE.md

provides AI with enough context to consistently evolve the application.

---

## AI-First Development

OneSpec is designed around the assumption that AI will be the primary implementation tool.

Rather than asking AI to search an entire codebase, OneSpec narrows the search space.

The AI has access to:

* Product Specification
* Design Guide
* Architecture
* Implementation index
* Tests

This allows AI to make targeted, incremental changes while preserving consistency across the project.

---

## Multiple Projections

The Product Specification can be rendered in multiple forms.

Examples include:

* Prototype View
* Graph View
* Compact Graph
* Screen Graph
* Sitemap
* Documentation
* Future implementation views

These are all different representations of the same underlying model.

Editing one representation updates the Product Specification, which updates every other projection.

---

## Guiding Principles

* The Product Specification is the primary artifact.
* The UI is generated from the Product Specification and Design Guides.
* Every structural requirement should be traceable to the UI.
* Every behavioral requirement should be traceable to implementation and tests.
* AI should modify the Product Specification first, then implementation.
* OneSpec should reduce search space for both humans and AI.
* The cloud product favors consistency and opinionated workflows.
* The power-user edition favors flexibility and extensibility.
* Traceability should be lightweight enough that developers will actually maintain it.
* OneSpec is not a wireframing tool. It is an AI-first application specification platform.

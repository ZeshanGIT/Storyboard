# Graph View — UX Requirements

Product requirements for the Graph View: what it looks like and how it behaves. No implementation details — those belong in a separate plan.

**Parent:** [`VISION.md`](VISION.md) · [`CONTEXT.md`](CONTEXT.md)

---

## Purpose

The Graph View answers navigation questions that MDX Preview and Prototype View cannot answer at a glance.

| View | Primary question |
|------|------------------|
| MDX Preview | What does each screen contain? |
| Prototype View | What happens when I click through the app? |
| **Graph View** | How are all screens connected, and which interaction leads where? |

Graph View is an **analysis and orientation** tool. It is not a replacement for click-through prototyping.

### Graph vs Sitemap

These are different concepts and must not be conflated in copy or UI.

| Term | Meaning |
|------|---------|
| **Sitemap** | Planned information architecture — pages that *should* exist |
| **Navigation graph** | Actual connections declared in wireframe MDX — where users *can* go |

Graph View shows the navigation graph only.

---

## Audience

- Authors reviewing flow structure while writing MDX
- Reviewers understanding app topology without clicking every path
- Anyone checking whether screens are wired as intended

---

## Placement in the shell

Graph View is a **third top-level tab** alongside MDX Preview and Prototype View.

- Tab label: **Graph View**
- The active MDX document (document picker) applies to Graph View the same way it applies to Preview and Prototype. Switching documents switches the graph.
- Graph View uses the **full width and height** available below the shell header. Unlike Preview/Prototype, it is not constrained to a narrow reading column — the canvas needs room to pan and zoom.

When codegen reports errors for the active document, Graph View follows the same error treatment as the other views: errors are visible; the graph is not shown until the document is valid.

---

## What appears on the graph

### Nodes

Each **screen** in the active MDX document is one node.

- Node label uses the screen's `title` when present; otherwise the screen `id`.
- The **entry screen** (first `<Screen>` in the document) is visually distinct — e.g. badge, border, or icon — so the starting point is obvious at a glance.

Modals are **not** separate top-level nodes. A modal is part of its parent screen's node.

### Edges

An edge represents a **declared navigation** from one screen to another screen.

- Screen → screen links produce edges between nodes.
- Links that open a modal, close a modal, or go back (`_close`, `_back`) do **not** produce edges between screen nodes. In Screen View, modal-triggering links may still show a local affordance on the node (see Screen View below).
- Multiple links from the same screen to the same destination produce **multiple edges** (or visually distinct edge handles), so parallel actions remain visible.
- Links marked `disabled` are **not** shown as navigable edges.

Edges are **directed**: direction indicates where the user goes when they activate the link.

---

## Two display modes

Graph View has two sub-modes. A toggle in the Graph View toolbar switches between them.

| Mode | Default? | Question it answers |
|------|----------|---------------------|
| **Screen View** | Yes | "What does the app look like, and which interaction leads to the next screen?" |
| **Compact View** | No | "How are all the screens connected?" |

Both modes show the same screens and the same screen-to-screen connections. Only node presentation and edge anchoring differ.

---

## Screen View

The default mode.

### Nodes

Each node renders a **scaled-down wireframe** of the screen content — the same structural appearance as Prototype View, not a styled mockup. The user should recognize the screen layout without reading labels.

Nodes are large relative to Compact View. The layout algorithm accounts for variable node size.

### Edges

Edges originate from the **navigable link or button** that triggers the transition (connector anchored at the nearest side of the control toward the destination). They terminate on the **nearest sensible boundary** of the destination screen (top, bottom, left, or right), chosen from relative positions — similar to Figma prototype connectors.

Edges render above screen cards so paths stay visible. **Hover a link or edge** to highlight that connection; other edges dim.

In Screen View, **click a screen-to-screen link** to animate the viewport to the destination screen and highlight that edge. Modal, back, and close links do not pan the canvas.

Parallel links from the same screen remain separate edges. Routes stay stable while panning and zooming.

Modal-opening links do not draw edges to other screens. They may show a local affordance on the triggering control within the node.

### Canvas controls

The user can:

- **Pan** — click-drag on empty canvas, or scroll wheel / trackpad scroll
- **Zoom** — pinch, ⌘/Ctrl + scroll, or dedicated controls
- **Fit to screen** — reset zoom so the full graph is visible
- **Minimap** — small overview in a corner for orientation on large graphs

---

## Compact View

An overview mode for structure, not content fidelity.

### Nodes

Each node is a **compact card** showing:

- Screen title (or id)
- Optional short description if one exists on the screen
- Count of **incoming** connections
- Count of **outgoing** connections

No wireframe content is rendered inside the node. **Hover a compact node** to show a scaled wireframe preview below the card; if the preview would clip the viewport, the canvas pans (or zooms out slightly) to keep it visible.

### Edges

Edges originate from the **node boundary**, not from individual controls. This keeps the overview readable when many links exist on one screen.

---

## Layout

### Initial layout

On first open (or when the active document changes), the graph is laid out automatically and **fit to screen** so all nodes are visible without manual zooming.

### Switching modes

Node size differs greatly between Screen View and Compact View, so **node positions are not preserved** when switching modes. The layout may be recalculated.

**Continuity rule:** if a screen is selected when the user switches modes, that screen stays **selected** and is **centered in the viewport** after the new layout is applied.

### Manual adjustment

Users may pan and zoom freely. Manual viewport position is not required to persist across mode switches or document switches in v1.

---

## Selection and interaction

### Clicking a node

Clicking a node **selects** it. It does **not** navigate to that screen in Preview or Prototype.

Selected state is clearly visible (highlight, border, or similar).

Clicking empty canvas **deselects** the current node.

### Clicking an edge

Hovering an edge highlights that connection (same as hovering its source link). Clicking an edge has no other behavior in v1.

### Relationship to other views

Graph View does not sync selection or scroll position with Preview or Prototype in v1. The user switches tabs explicitly when they want to read or click through a screen.

---

## Visual design constraints

Graph View follows OneSpec non-goals:

- No brand colors, shadows, or typography systems on graph chrome
- Node wireframes use the same structural wireframe style as primitives
- Shell chrome (toolbar, tabs, minimap frame) may use existing shadcn/Tailwind shell styling

The graph should feel like a **diagram of the spec**, not a designed product mockup.

---

## Empty and edge cases

| Situation | Expected behavior |
|-----------|-------------------|
| Active document has one screen | Single node, no edges; fit to screen |
| Active document has screens but no links | Nodes visible, no edges |
| Codegen errors on active document | Same error UI as other views; no graph |
| No MDX documents | Same empty state as other views |

---

## Out of scope (v1)

The following are explicitly **not** required for the first version. They may appear in a later inspector panel or enhancement pass.

- Inspector / side panel with screen metadata
- Reverse references ("referenced by …")
- Validation overlays (unreachable screens, dead ends, broken links)
- Path highlighting between two screens
- Search, filter, or grouping
- Collapse/expand subgraphs
- Export as image
- Edge labels or edge hover highlighting
- Animated navigation paths
- Click node → jump to screen in Preview or Prototype
- Cross-document graph (all MDX files at once)

---

## Acceptance criteria (UX)

The first version is complete when a reviewer can confirm all of the following without reading implementation code:

1. Graph View appears as a third shell tab and respects the active document picker.
2. Every screen in the active document appears as a node; the entry screen is visually distinct.
3. Every screen-to-screen link (non-disabled) appears as a directed edge; modal/back/close links do not create screen-to-screen edges.
4. Screen View shows scaled wireframe content per node; edges anchor at link controls with smart target ports; hovering a navigable link highlights its edge.
5. Compact View shows title, connection counts, node-anchored edges, and a wireframe preview on node hover.
6. User can pan, zoom, fit-to-screen, and use a minimap.
7. Clicking a node selects it without leaving Graph View or switching to another tab.
8. Switching modes recalculates layout but preserves selection and centers the selected node.
9. Graph canvas uses full width below the header.

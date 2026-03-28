---
name: elite-style
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
version: 2.0.0
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Output the design brief as an HTML comment block (`<!-- DESIGN BRIEF: ... -->`) at the top of the file, keeping the deliverable clean while preserving intent documentation. Any feature called out as a key differentiator in the design brief is a binding commitment — it MUST be implemented in the code, not left as a description.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise. All animations MUST include a `@media (prefers-reduced-motion: reduce)` block.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density. At least one element MUST violate the primary grid — e.g., a card using negative margin or translate to break its column boundary, a heading bleeding outside the container, or a decorative element positioned outside the content flow.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays. When using a custom cursor on body, always reset to `cursor: pointer` on `<a>`, `<button>`, and other interactive elements.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## Tailwind CSS v4 Patterns

When the project uses Tailwind CSS v4, leverage these v4-specific features for higher design quality.

### `@theme` for design tokens

Define custom colors, fonts, animations, and easing via `@theme` instead of `:root` CSS variables:

```css
@theme {
    --font-display: 'Playfair Display', serif;
    --color-accent: oklch(0.7 0.25 330);
    --ease-fluid: cubic-bezier(0.16, 1, 0.3, 1);
    --animate-fade-in: fade-in 0.6s var(--ease-fluid) both;
}
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
}
```

Use `oklch` color space for vibrant, perceptually uniform palettes.

### Advanced gradients

- `bg-linear-<angle>` for precise angles (e.g., `bg-linear-135`)
- `bg-radial-[at_25%_25%]` for positioned radial gradients
- `bg-conic` for color-wheel / sweep effects
- Gradient stop positioning: `from-10% via-30% to-90%`
- Color space interpolation (`in oklch`, `in hsl longer hue`) for richer blends

### 3D transforms (grid-breaking)

Directly supports the "grid-breaking" spatial composition requirement:

- `perspective-*`, `rotate-x-*`, `rotate-y-*`, `rotate-z-*` for depth
- `backface-hidden` for card-flip interactions
- `transform-3d` / `preserve-3d` for layered 3D compositions

### Shadow layering

Compose up to 4 shadow layers without custom CSS:

- `shadow-*` + `inset-shadow-*` + `ring-*` + `inset-ring-*`
- Tinted elevation: `shadow-blue-500/20`
- Combine for realistic material depth

### Container queries

Use `@container` for component-level responsive design:

- `@sm:`, `@md:`, `@lg:` size variants inside containers
- Named containers (`@container/card`) for nested query contexts
- Prefer over media queries for reusable, self-contained components

### Motion & transitions

- `starting:` variant — animate elements on first render via `@starting-style`, no JS needed
- `transition-discrete` for animating `display`/`visibility` changes
- `motion-reduce:` variant for `prefers-reduced-motion` (required on all animations)
- Define custom easing curves with `--ease-*` tokens in `@theme`

### Modern utility variants

- `not-hover:`, `nth-*:` for advanced state targeting
- `field-sizing-content` for auto-resizing textareas without JS
- `inert` variant for non-interactive element styling
- `scheme-dark` / `scheme-light` for native dark-mode scrollbar support

## Completeness Requirements

Generated output MUST be a complete, runnable file. Truncated code is not acceptable. If a component is described in the design brief, it MUST appear in the final output.

**Before outputting, verify:**

1. All interactive states are wired to JS (no CSS-only state classes without corresponding JS)
2. All described differentiators from the design brief are implemented
3. Responsive breakpoints are present for mobile/tablet/desktop
4. Accessibility attributes on interactive elements (aria-labels, roles, focus styles)
5. No duplicate resource tags (e.g., always pair `fonts.googleapis.com` preconnect with a `crossorigin fonts.gstatic.com` preconnect — never duplicate the same one)

## Technical Notes

- Always pair `<link rel="preconnect" href="https://fonts.googleapis.com">` with `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` — never duplicate the googleapis link.
- Use `will-change` or CSS containment on animated elements for performance.
- Avoid excessive `z-index` values (e.g., `9999`) — use a layered scale.
- Avoid near-identical font sizes that create visual noise without meaningful distinction (e.g., `0.62rem` vs `0.65rem` vs `0.68rem`).

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

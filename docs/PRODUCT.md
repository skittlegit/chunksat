# PRODUCT.md

## Register

Product — design serves the workflow. This is a tool; the interface exists to make the scheduler legible and controllable, not to impress viewers.

## Users

Hackathon participants (engineers / scientists) evaluating orbital imaging schedules for a "Lost in Space" competition. Users are technical: they understand orbital mechanics, scoring functions, pass geometry. They're running the tool themselves.

**Context:** Browser on a laptop or desktop, in a focused session — loading parameters, firing runs, reading scores.

## Product Purpose

A console for an orbital imaging scheduler. Users configure pass parameters, pick a scan strategy, run the planner, and inspect results: scoring breakdowns, coverage maps, pass timelines, and frame tables. The primary task on any screen is comparing run outcomes to improve the mission total score.

## Brand Personality

Technical · minimal · focused

The interface should feel like a well-built internal tool with intentional restraint — not a product demo, not a space visualization.

## References

No external references specified. Inferred closest matches: Raycast (terminal-native, dense, typographically precise) and the monochrome end of Linear. Monospaced coordinate data and hairline rules signal tool-first thinking throughout.

## Anti-References

- **Space.com / NASA Worldwind** — overwrought space drama: starfields, heroic gradients, glowing orbit lines. This is a scheduler, not a space visualization.
- **Grafana / Kibana** — legacy ops sludge: cramped widget grids, inconsistent type scales, enterprise dashboard aesthetics from 2014.

## Strategic Design Principles

1. **Brightness = meaning.** The palette is strictly monochrome. The only accent is white. Status is communicated through brightness, weight, and pattern — never hue. Every deviation from the grayscale ramp must carry semantic weight.
2. **Density without noise.** Tabular data and numeric coordinates are the core content. Layout serves density; noise is removed, not density. Tight line heights, hairlines, and precise type spacing over comfortable padding.
3. **Controls recede; results lead.** Parameters and strategy selectors are tools — they should feel subordinate to the output panels (scores, maps, timeline). Visual hierarchy follows the workflow: configure → run → inspect.
4. **Terminal-native legibility.** Monospace for all coordinates, scores, and identifiers. Proportional sans for labels and navigation. No italics.
5. **Stillness over animation.** Only the run state and playback scrub warrant motion. Everything else is static. All motion respects `prefers-reduced-motion`.

## Accessibility

WCAG AA. The monochrome palette naturally satisfies color-blind accommodation (no hue-only differentiation). All animations are opt-in and gated on `prefers-reduced-motion`.

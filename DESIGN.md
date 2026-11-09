---
name: TheWingTheWong
description: A studio-monograph title page for a GitHub profile, set as outlined SVG cards on warm graphite.
colors:
  graphite-ground: "#121211"
  paper-ink: "#EEECE6"
  stone: "#A3A099"
  slate: "#8A8881"
typography:
  display:
    fontFamily: "Schibsted Grotesk"
    fontSize: "96px"
    fontWeight: 600
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: "40px"
    letterSpacing: "0em"
  title:
    fontFamily: "Schibsted Grotesk"
    fontSize: "34px"
    fontWeight: 500
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "32px"
    letterSpacing: "0em"
  link:
    fontFamily: "Schibsted Grotesk"
    fontSize: "20px"
    fontWeight: 400
    letterSpacing: "0em"
  label:
    fontFamily: "Schibsted Grotesk"
    fontSize: "18px"
    fontWeight: 400
    letterSpacing: "0em"
rounded:
  card: "20px"
  card-m: "14px"
spacing:
  margin: "48px"
  margin-m: "24px"
  row-top: "46px"
  idea-gap: "38px"
  bar-to-sentence: "74px"
components:
  title-card:
    backgroundColor: "{colors.graphite-ground}"
    textColor: "{colors.paper-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.card}"
    padding: "{spacing.margin}"
    width: "760px"
  title-card-m:
    backgroundColor: "{colors.graphite-ground}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.card-m}"
    padding: "{spacing.margin-m}"
    width: "380px"
  draw-bar:
    backgroundColor: "{colors.paper-ink}"
    width: "56px"
    height: "4px"
  draw-bar-m:
    backgroundColor: "{colors.paper-ink}"
    width: "32px"
    height: "3px"
  work-row:
    backgroundColor: "{colors.graphite-ground}"
    textColor: "{colors.paper-ink}"
    typography: "{typography.title}"
    padding: "{spacing.margin}"
    width: "760px"
  work-row-m:
    backgroundColor: "{colors.graphite-ground}"
    textColor: "{colors.paper-ink}"
    padding: "{spacing.margin-m}"
    width: "380px"
  work-kind:
    textColor: "{colors.slate}"
    typography: "{typography.label}"
  work-idea:
    textColor: "{colors.stone}"
    typography: "{typography.body}"
  work-link:
    textColor: "{colors.paper-ink}"
    typography: "{typography.link}"
---

# Design System: TheWingTheWong

## Overview

**Creative North Star: "The Studio Monograph"**

The profile is the title page of a monograph: one name, one sentence, three works, and nothing else. It is a single warm-graphite slab of type, built as a stack of SVG cards whose text is outlined to paths from one news-house grotesk, so GitHub renders it exactly in light theme, dark theme, and on a phone. Hierarchy comes from size and ink alone; space does the separating that lines, boxes and badges would do elsewhere.

Density is low and deliberate. The name is set large and tight, a short paper-white bar draws in beneath it once, and the sentence opens in full ink before falling to stone. Each work is a single baseline (name, kind, link and arrow) over a one-line idea. The system is a refusal of the developer-profile stack (banners, badges, stat widgets, activity graphs) and of the pixel/terminal costume.

**Key Characteristics:**
- One face, three weights, outlined to paths; no live text, no external fonts.
- Four warm neutrals, no hue accent; ink level carries all emphasis.
- Stacked cards that read as one continuous slab: rounded top on the first, rounded bottom on the last, square seams between.
- One authored motion (the bar draw) and one drawn mark (the north-east arrow).
- Two fixed layouts, desktop (760 wide) and phone (380 wide), served through `<picture>`.

## Colors

A monochrome of warm neutrals on a near-black graphite, with emphasis set by stepping down the ink, never by adding a hue.

### Primary
- **Paper Ink** (#EEECE6): the voice. The name, the bar, the sentence's lead clause ("Founder, FormzoAI."), work names, link labels and the arrow stroke. Roughly 15.9:1 on the ground.

### Neutral
- **Warm Graphite Ground** (#121211): the only surface. Every card is filled edge to edge with it; the card is the page, not a container on a page. It is what keeps the slab legible on GitHub's white light theme and distinct on its blue-black dark theme.
- **Stone** (#A3A099): continuation text. The rest of the sentence after the lead clause and each work's one-line idea. About 7.2:1 on the ground.
- **Slate** (#8A8881): metadata only. The work kind ("Live product", "Open source", "Hackathon"). About 5.3:1 on the ground, the lowest ink allowed.

### Named Rules
**The Three Inks Rule.** Text uses exactly three inks on the ground: paper for what you name, stone for what you explain, slate for what you classify. No fourth tone, no accent color.

**The Lead-Then-Fall Rule.** A sentence that introduces the person opens in paper ink for its identifying clause and drops to stone for the rest, on the same line.

## Typography

**Display Font:** Schibsted Grotesk (outlined to paths; no fallback because no live text ships)
**Body Font:** Schibsted Grotesk
**Label Font:** Schibsted Grotesk

**Character:** A single news-house grotesk carrying every role, so the page reads like one editorial voice at several volumes. Weight separates roles (600 display, 500 names, 400 everything else); kerning is on for every run.

### Hierarchy
Desktop values below; the phone layout is listed in parens and is sized so no outlined text renders under ~12px in a ~343px column.
- **Display** (600, 96px with auto-shrink to fit the margins (phone 48px), tracking -0.03em): the name only, top-left at the margin.
- **Headline** (400, 30px / 40px leading (phone 19px / 26px)): the one introductory sentence, wrapped greedily under the name.
- **Title** (500, 34px (phone 24px), tracking -0.01em): work names.
- **Body** (400, 24px / 32px leading (phone 17px / 23px)): the one-line idea under each work. Desktop must fit on one line; the build fails if it does not.
- **Link** (400, 20px (phone 15px)): the right-aligned destination label ("formzo.ai", "GitHub").
- **Label** (400, 18px (phone 15px)): the work kind, sentence case, on the work name's baseline.

### Named Rules
**The One Face Rule.** Schibsted Grotesk at 400, 500 and 600 is the entire type system. A new role is a new size or ink, not a new family.

**The Outlined Text Rule.** All text ships as SVG paths generated from the font files, never as `<text>` with a font reference, so rendering is identical everywhere GitHub shows an image.

**The No Orphan Rule.** Wrapped text never ends on a single word; the wrap pulls a word down from the previous line.

## Layout

Each card is a fixed-width canvas: 760 units on desktop (displayed at about 1.09x in GitHub's ~830px column) and 380 units on phone (about 0.9x in a ~343px column), swapped by `<source media="(max-width: 600px)">`. Cards stack flush with `align="top"` inside one centered paragraph so the seams disappear and the stack reads as one slab.

Everything hangs from a single left margin (48px; phone 24px), mirrored on the right for right-aligned link labels. The name sits at the top margin; the bar sits 30px below the name's baseline (phone 18px); the sentence starts 74px below the bar (phone 44px). In a work row the name baseline sits 46px from the row top (phone 34px), the idea 38px below that (phone 26px). Card heights are computed from content, not fixed. Desktop ideas are single-line; the phone layout allows them to wrap.

**The Space-Not-Lines Rule.** Sections are separated by vertical space only. Rows have no dividers, no borders and no zebra fill; the gap between one idea and the next name does the work.

## Elevation & Depth

Flat. There are no shadows, gradients, glows or tonal layers; the graphite ground is a single fill and depth is not part of this world. Separation from GitHub's own page comes from the slab's contrast against the theme background, in either theme.

**The Flat Slab Rule.** No shadow, blur or second surface tone, on any card, in any state.

## Shapes

The slab has gently rounded outer corners (20px; phone 14px) and square inner seams: the title card rounds only its top corners, the last work row only its bottom corners, middle rows none. Corners are drawn as quadratic curves in the card path. The only internal shapes are the short paper bar under the name (56 x 4; phone 32 x 3) and the north-east arrow: an unfilled stroke, a diagonal plus a corner, sized to the link text (13 units; phone 10.5) with stroke weight at 0.17 of its size.

## Components

### Title Card
The page's opening: name, bar, sentence. Graphite ground, rounded top only, display name in paper ink, sentence in paper then stone. Height grows with the wrapped sentence. Its `<title>` repeats the full text for screen readers, and the README `<img>` carries the same alt.

### Draw Bar (signature motion)
The one authored moment. A short paper-ink bar under the name scales in from its left edge once on load: `scaleX(0)` to full over 0.9s with `cubic-bezier(.16,1,.3,1)` after a 0.2s delay, fill `both`. It never loops. Under `prefers-reduced-motion: reduce` all animation is removed and the bar sits at rest.

### Work Row
One card per work, wrapped in a link to the work. Line one, on a single baseline: the work name (title type, paper ink), then the kind (label type, slate) at 0.4 x name size after it, and right-aligned at the margin the link label (paper ink) followed by the drawn arrow. Line two: the idea in stone body type. Middle rows are square; the last row rounds its bottom corners and adds the full margin below. Its `<title>` reads "Name, kind: idea".

### North-East Arrow
The single permitted mark, drawn as a stroke path in paper ink, never a font glyph or icon set. It appears only after a link label and means "opens elsewhere".

## Do's and Don'ts

### Do:
- **Do** set every surface on Warm Graphite Ground (#121211) and keep text to the three inks: paper (#EEECE6), stone (#A3A099), slate (#8A8881).
- **Do** generate every card from `scripts/build.mjs` in both layouts (760 and 380) and serve the phone file through `<picture>` at `max-width: 600px`.
- **Do** outline all text to paths from Schibsted Grotesk 400/500/600 with kerning on.
- **Do** keep desktop work ideas to one line at 24px; shorten the copy rather than shrink the type.
- **Do** keep phone text at or above ~12px rendered.
- **Do** honor `prefers-reduced-motion` in any card that animates.

### Don't:
- **Don't** add dividers, borders, boxes or row fills; the bar under the name is the only stroke-like shape, and space separates everything else.
- **Don't** add badges, dots, emoji or icon-font glyphs; the drawn north-east arrow after a link label is the only mark.
- **Don't** add a hue accent, gradient or shadow.
- **Don't** introduce a second typeface, live `<text>`, or an externally loaded font.
- **Don't** add looping or repeated animation; the bar draws once.
- **Don't** put a label above a heading; metadata such as the work kind sits after the name on its baseline, in slate.

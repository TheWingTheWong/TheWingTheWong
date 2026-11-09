---
name: TheWingTheWong
description: The last shot of a film. A card in hand, a fade to dark, one end-credit disclaimer.
colors:
  ground: "#050B0E"
  credit-ink: "#D8D4CA"
typography:
  credit:
    fontFamily: "Open Sans"
    fontWeight: 300
    fontSize: "15.5px"
    letterSpacing: "0.045em"
  credit-m:
    fontFamily: "Open Sans"
    fontWeight: 300
    fontSize: "14px"
    lineHeight: "22px"
    letterSpacing: "0.04em"
---

# Design System: TheWingTheWong

## Overview

**North star: "End Titles."** The whole profile is one frame from a film that is just ending: a hand holds the "I'm CEO, B*tch." card toward the camera, the shot fades into its own darkness, and after a beat a single disclaimer appears: "Any resemblance to a functioning company is intentional." The card is the joke; the disclaimer shows the joke is self-aware, and "intentional" quietly says the company is real.

## Colors

- **Ground #050B0E:** sampled from the photo's bottom edge, so the fade has no seam. Everything below the photo is this colour with faint film grain (fractal noise at 5%).
- **Credit ink #D8D4CA:** warm off-white, like projected light. About 14:1 on the ground.

No other colours. The photo supplies the green and the card's navy.

## Typography

Open Sans Light only, outlined to paths (no live text, no font loading). It sits close to the humanist sans printed on the card, so the line looks set by the same hand. Small, slightly tracked, centered: the register of the legal line at the end of real credits, never a headline.

## Layout

- Desktop SVG, 830 wide: the full photo (16:9), a smoothstep fade over its lower third, then 300 units of dark with the line optically centred.
- Phone SVG, 380 wide: tighter crop on the card so its print stays legible, fade from below the card, the line on two lines, 200 units of dark.
- Square corners: it is a film frame.

## Motion

One move, once: the shot settles from 104.5% to 100% over 7s with an exponential ease-out. The credit line is always visible, never animated (user, 2026-11-09). Nothing loops. `prefers-reduced-motion` removes the settle.

## Rules

- One line, ever. A second line, the projects or a name line turn it from a scene into a slogan board.
- No links, badges, stats or icons.
- Rebuild with `node scripts/build.mjs`. Files are named by content hash so GitHub's image cache always refreshes.

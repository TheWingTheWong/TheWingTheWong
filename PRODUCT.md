# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (GitHub profile README: rendered by github.com, images only)

## Users
Primary: hackathon judges and technical recruiters who land on github.com/TheWingTheWong after seeing a submission or a CV, and spend roughly ten seconds deciding whether this person is worth a closer look.

## Product Purpose
The profile is Ansorjon Juraev's public face on GitHub. Success: a visitor leaves convinced this is a creative, unusual mind who builds things nobody else would, and clicks into a project.

## Positioning
Ansorjon "vibe codes" with AI and treats that as licence to build anything: robots designed by Claude and stress-tested in 1,024 browser simulations, an AI procurement decision room, a form builder that interviews people. The profile should feel like it was made by someone who can make anything, not assembled from widgets.

## Operating Context
- Rendered inside GitHub's README column (~830px wide on desktop, ~360px on phones), in GitHub light or dark theme.
- Only `<img>` content renders: SVG with CSS/SMIL animation works, no JavaScript, no external fonts or stylesheets inside SVG, no interaction beyond links.
- Visuals are static SVG cards built locally by `scripts/build.mjs` (desktop and a narrow phone variant, chosen with `<picture>`); there is no scheduled rebuild.

## Capabilities and Constraints
Must keep: the name, one sentence, and three works (FormzoAI, RAUM, AnyBuild). Kept short on purpose (2026-11-09): no commit counts, streaks or "shipping daily" signals, no calendar, skyline, signal feed, tool strip or end screen, since GitHub already shows the contribution graph directly below.

## Brand Commitments
- Name: Ansorjon Juraev, handle TheWingTheWong.
- FormzoAI (formzo.ai): "Describe a form in one sentence and AI writes it. People answer in a short chat that asks the follow-up, and every response comes back summarized, scored and ranked."
- AnyBuild: "Describe a robot → Claude designs it in 3D → 1,024 browser simulations → parts, build guide, firmware."
- RAUM: "a private AI interpreter that lives in the room" (open source).

## Evidence on Hand
Real: the three projects above, the GitHub contribution calendar, public repo counts. Absent and not to be invented: awards, placements, user counts, revenue, stars, testimonials.

## Product Principles
- Show the work doing something, not adjectives about the person.
- Every element should look made for this profile, never a stock widget.
- No activity signals: no stats, streaks, commit counts, dates or "shipping daily".
- Unusual beats impressive-looking.

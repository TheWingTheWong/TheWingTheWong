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
- Visuals regenerate daily by GitHub Actions (`scripts/build.mjs`) from the GitHub GraphQL API.
- A daily "pulse" workflow commits a random number of times per day so the contribution calendar is always green.

## Capabilities and Constraints
Must keep: real live stats (contributions, streak), project showcase (FormzoAI, AnyBuild, SWITCHYARD), a snake-style game playing across the contribution grid, a 3D contribution graph, and tech stack icons.

## Brand Commitments
- Name: Ansorjon Juraev, handle TheWingTheWong.
- FormzoAI (formzo.ai): "Describe a form in one sentence and AI writes it. People answer in a short chat that asks the follow-up, and every response comes back summarized, scored and ranked."
- AnyBuild: "Describe a robot → Claude designs it in 3D → 1,024 browser simulations → parts, build guide, firmware."
- SWITCHYARD: "the AI procurement decision room (Nebius x NVIDIA hackathon, Siemens track)."

## Evidence on Hand
Real: the three projects above, the GitHub contribution calendar, public repo counts. Absent and not to be invented: awards, placements, user counts, revenue, stars, testimonials.

## Product Principles
- Show the work doing something, not adjectives about the person.
- Every element should look made for this profile, never a stock widget.
- Real data only; numbers come from the API.
- Unusual beats impressive-looking.

# Flow build tools

Local copies of flow-animation-page and ondine-flow-motion from the user-selected bear2u/odin-svg-animation-skills repository, retrieved 2026-10-25. No global skill installation is performed.

Dependencies are pinned in each tool's package.json and package-lock.json. Install each with npm ci --ignore-scripts. The source repository's diagram-choice gate was satisfied by the user's explicit choice of seven flowchart pages.

`npm run build:flow` regenerates public/flow from flow-src, then applies the project's navigation, reader copy, styles and accessibility controls. The SVG player retains the supplied single-clock, draw-on and reduced-motion behavior. The upstream mask stroke-width statement was swallowed by an inline comment; the build restores it. The build also scopes follow-scrolling to the map and excludes interactive controls from document keyboard shortcuts.

The verification helper additionally supports FLOW_VERIFY_DIR to keep local screenshots outside public output. Publication must include only public/flow and the relevant guide changes; no validation artifacts or source credentials are needed by the site.

Guide figures progressively load the same player with `?embed` after a reader clicks. Embedded mode removes page navigation, starts complete and paused, and fits the whole map within its viewport. Same-origin messages let the guide start/pause that player; leaving the figure, switching players, or hiding the page pauses it. Reduced-motion readers explicitly start playback from the player controls. The full SVG remains the initial and no-JavaScript fallback.

# Notes Vue migration — execution contract, 2026-10-24

Objective: migrate every existing Notes frontend route and shared interaction to
Vue while preserving public content, appearance, canonical URLs, SSR HTML, data
privacy and delivery behavior. This is the sole current fleet implementation
milestone after acceptance of the initial shared Vue primitives.

Baseline: production web 707bb14f0aee95120a8755ae20dd21d3ff7881cb and data
b8029a2021a058fab6f9882c0a342708895b1798. data.lock.json names an older default;
use EXPECTED_DATA_COMMIT with a verified clean snapshot of the production data.
Never copy article sources or private data into Git. Preserve the canonical apex
/notes URL separately from the provider hostname notes.phenomcanvas.com.

Implementation: Vue 3.5.44 / Vite 8.3.5, compatible Vue Router, pinned Node 22.23.4.
Adopt @phenomcanvas/ui-vue from the reviewed fixed package and extend the shared
package for missing controls instead of duplicating framework code per site.
The explicit fleet Vue decision supersedes the old React-only package entry,
while retaining its single-source tokens, styles and visual behavior.

Required parity: home/archive/stream/all, articles, KB index/detail, inventory,
timeline, songs, not-found; navigation/back/query state; markdown/KaTeX HTML,
annotations and citation popup, reading scale, appearance, headings/anchors,
mobile navigation and content layout. Retain existing exported inventory/timeline
JSON, PDF and cross-product links. Do not add login, Supabase or a content API.

Acceptance: exact data hash gate and existing meaningful tests, type check,
client + SSR build, complete static route validation, content and metadata
comparison, desktop/mobile browser behavior, public immutable preview with
expected source/data/package IDs, noindex, immutable assets and true 404.
Existing tests that hardcode React JSX implementation must be updated to verify
the retained behavior/contract, not silently deleted to make Vue pass.

Safe checkpoint: isolated vue-migration-20261024 branch. No production promotion
until the complete real application preview passes and the production authority
gate is met. The initial shared ReadingShell demo is not full Notes parity;
mobile rail, automatic headings, ArticleLayout/SiteHeader, annotations and SEO/SSR
integration still need implementation here and/or in the shared Vue package.

## Implementation checkpoint (2026-10-24)

Native Vue JSX pages and Vue Router client/SSR entry points are implemented in
this isolated branch. Shared reading controls live only in ui/packages/vue;
Notes consumes a fixed vendor tarball. The original UI CSS/tokens/palettes/font
sources have no diff between v0.1.68 and the shared package design source.

Data reproduction: clean detached b8029a2021a058fab6f9882c0a342708895b1798
exports 105 files and produces manifest SHA-256
5cd2118a754dbd8e4a3ca1789ac01773e64da62e2c972219663b6ed056386cb7,
identical to production. The current prose-rules package rejects an unchanged
existing legal article's wording (“三組規定”; rule added 2026-10-21). No content
was edited or gate disabled: the reproduction uses archived historical Ops
6021b92a66a36b6949622ed2ec9e2ba82bb1c648 prose-rules and passes the full data
validator. This is baseline reproduction only; the newer editorial gate mismatch
must stay visible before any new production pipeline run.

The unchanged React source 707bb14 is built separately in sibling notes-react
against this same verified snapshot. It passes all original build checks:
82 content routes plus 404. tests/vue-parity.mjs compares all static routes'
exact prose HTML, headings, link destinations, canonical metadata and JSON-LD,
plus the three public JSON payloads. tests/vue-browser.mjs tests real interactions
and fails on Vue/hydration warnings. These new Vue checks are not yet accepted
until execution succeeds; source conversion alone is not delivery.

Current external state: Home Vue production remains usable; Notes production
remains React. No Notes preview or production promotion is implied by this
checkpoint. Next action: finish fixed-package installation, run original tests,
build Vue, static parity and browser regression, repair failures, then publish
and externally verify an immutable Notes preview. Production remains gated.

## Local acceptance

All original six content tests, installed-package strict typecheck, Vue client/SSR
build, 82 content-route validation plus 404, 83-route content/metadata/navigation
parity, and nine desktop/mobile browser regression groups pass. Browser console
and hydration errors: zero. Mobile drawer VNode reuse and annotation container
attribute forwarding were fixed before acceptance. Route components load through
Vue Router lazy imports; full article HTML is still produced at build time.

Exact package provenance is in vue-package-lock.json. The public preview still
requires an external probe before any preview_verified state is recorded.

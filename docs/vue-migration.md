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

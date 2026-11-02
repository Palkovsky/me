# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: systems and security engineers (eBPF, Linux and Windows internals, Rust, C, low-level programming) who land on one deep dive from search, Hacker News, or a shared link and read it end to end, copying code and commands along the way.

Secondary, close behind: recruiters and hiring managers looking Dawid up. The About page, and the résumé link whenever it is not hidden by the stealth flag, must hold up to their scrutiny.

## Product Purpose

The personal site and technical blog of Dawid Macek. It publishes research and implementation notes as long, code-heavy articles (roughly 2,400 to 4,600 words each) and presents the author as a working engineer.

Success means engineers finish an article, copy its code, and come back (RSS); hiring contacts leave with a credible picture of the author's depth.

## Positioning

First-hand notes from an engineer who builds detection engines and endpoint agents in Rust and C++: each article is a reproducible experiment across user space and kernel space, with complete code, real command output, and measured results, not a summary of other people's documentation.

## Operating Context

- Static Hugo site; the active theme lives in `themes/` (currently `web-safe`; the previous `technical-journal` theme is kept for rollback). Built by GitHub Actions on push to `main` (Hugo extended 0.162.0 in CI) and served from GitHub Pages with no backend.
- Articles are page bundles at `content/posts/YYYY/slug/index.md` with TOML front matter: `title`, `date`, `years`, `tags`, `seo` (description), `og_image`, optional `og_image_alt`. A `<!--more-->` marker separates the summary.
- Content is Markdown with many fenced code blocks (C, Rust, Bash, some with `hl_lines`), benchmark tables, and SVG/PNG figures. Hugo Chroma highlights code with CSS classes (`noClasses = false`) that the theme colours; `technical-journal` needs `noClasses = true`.
- The home page holds the bio from `content/_index.md` followed by the full article list.
- Readers arrive on desktop and on phones.

## Capabilities and Constraints

- URLs stay stable: `/`, `/posts/`, `/posts/YYYY/slug/`, `/tags/…`, `/years/…` (year terms resolve under `/posts/:slug/`), and `/about/` as an alias of `/`.
- SEO metadata, Open Graph images, JSON-LD, RSS (`index.xml`), the sitemap, and `robots.txt` keep working.
- `params.stealth = true` hides the LinkedIn and résumé links; CI downloads the résumé files only when stealth is off.
- Reading tools that exist today and must survive: table of contents (sidebar on wide screens, collapsible inline on narrow ones), active-section highlighting, reading progress, and a language label plus copy button on code blocks.
- Anything stateful is client-side only.
- Phones get the whole site without pinch-zooming or sideways page scrolling.

## Brand Commitments

- Name and site title: "Dawid Macek".
- Words are fixed: every existing piece of copy (articles, home bio, navigation and page labels) stays as written. The redesign changes how things look and behave, never what they say, and adds no period-flavoured copy.
- The kangaroo with a chainsaw (`static/kangaroo.svg`, `static/favicon.svg`, `static/favicon.ico`, `static/apple-touch-icon.png`) stays as the favicon only; it is not a design centrepiece.
- User brief, 2026-11-02: the site should look like a website from the 1990s, unmistakably so at first glance, while staying mobile-friendly and using JavaScript for enhancements such as reading progress in articles.

## Evidence on Hand

- Four published articles (2025–2026) with code, one benchmark table set, an SVG architecture diagram, and per-article OG images.
- The home bio in `content/_index.md`.
- No visit counts, awards, badges, guestbook entries, or testimonials exist; none may be invented.
- The GitHub link is commented out in `hugo.toml`; LinkedIn and the résumé are gated by `stealth`.

## Product Principles

1. The long article comes first: nothing decorative may slow reading, scanning code, or copying it.
2. Only truthful furniture: no invented counters, awards, badges, or guestbook entries.
3. Every viewport is first-class: a phone gets the full experience without zooming or sideways scrolling.
4. The site holds up to professional scrutiny; playfulness never undercuts the author's seriousness.
5. The words belong to the author; design changes presentation and behaviour only.

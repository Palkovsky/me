---
version: 1
slug: "themes-web-safe-layouts-page-html"
primary_target: "themes/web-safe/layouts/page.html"
related_targets: ["themes/web-safe/layouts/_default/baseof.html","themes/web-safe/layouts/index.html","themes/web-safe/layouts/list.html","themes/web-safe/assets/css/main.css","themes/web-safe/assets/js/main.js"]
---

# Surface brief: site theme (article page first)

Scope: the whole Hugo theme `themes/web-safe` (home/About, article, archive, tags, years, 404). First surface: the article page. Visitor mode: Read.

Audience and job: systems and security engineers reading one long, code-heavy deep dive end to end; hiring contacts checking About. Constraints: existing words unchanged, SEO/URLs/RSS untouched, phone-first-class, kangaroo favicon only, no invented furniture.

## Direction contract

THESIS: The site as a carefully built 1998 homepage: one centred table of banner row, navy navigation column and white reading cell, every colour from the 216 web-safe palette. It refuses the modern centred-column dev blog with mono labels, and GeoCities or Windows-98 costume.

OWN-WORLD: Steel-blue #336699 ground; midnight #000033 banner with the name embossed in gold Georgia; navy #003366 column, white Verdana links on gold square bullets, gold #FFCC00 marks the current item; white cell, black Georgia text, #0000CC links, #663399 visited; outset/inset bevels, shaded rules, #CCCCCC push buttons; code in a beveled table with web-safe Visual C++ colours.

STORY: An engineer lands on a deep dive, sees an engineer's 1998 homepage at a glance, reads a calm Georgia column with contents and progress beside it, copies code, and moves to the next article; a hiring contact reads About and finds the email.

FIRST VIEWPORT: Article at 1440: steel-blue ground, centred 1100px table 18px down; 84px banner, name ~34px; 230px column with About, Blog, RSS, a rule, gold "In this article" contents (the existing label; "Table of contents" names the phone menu), the current section on a gold bar, Progress in a sunken gold bar; cell with breadcrumbs, Georgia bold title ~32px, dek, meta, rule, 17px Georgia at a 40rem measure, navy Verdana h2 on a gold square, code in a beveled table with language and Copy. Phones: one column; a sticky navy bar in the cell holds the contents toggle and a gold progress line. Signature interaction: the column follows the reader (gold bar steps to the current section, the progress bar fills, visited titles turn purple). Motion grammar: none; every state changes instantly, as in a 1998 browser.

FORM: Table-layout homepage, 1998; my grounded candidate #1 of the safer re-roll lineup, picked by the user. seed:d3a8f52655746160

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Platforms without Georgia/Verdana (Android, most Linux) get self-hosted Gelasio and DejaVu Sans; verify they load only there.

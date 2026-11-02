---
name: Dawid Macek
description: An engineer's carefully built 1998 homepage, holding a calm modern reading column.
colors:
  steel-ground: "#336699"
  steel-light: "#6699cc"
  midnight: "#000033"
  navy: "#003366"
  sky: "#99ccff"
  gold: "#ffcc00"
  gold-light: "#ffff99"
  gold-dark: "#996600"
  paper: "#ffffff"
  ink: "#000000"
  ink-soft: "#333333"
  ink-faint: "#666666"
  shade: "#666666"
  rule: "#999999"
  silver: "#cccccc"
  link: "#0000cc"
  visited: "#663399"
  hover: "#cc0000"
  mark: "#ffff99"
  syntax-keyword: "#0000ff"
  syntax-comment: "#006600"
  syntax-string: "#990000"
  syntax-number: "#993300"
  syntax-builtin: "#006666"
typography:
  display:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.3
  subtitle:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.35
  list-title:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
  headline-compact:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
  title-compact:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.3
  minor:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  body-large:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  summary:
    fontFamily: "Georgia, Gelasio, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  chrome:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Verdana, \"DejaVu Sans\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  code:
    fontFamily: "\"Lucida Console\", Monaco, \"Courier New\", monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
spacing:
  frame-offset: "18px"
  shell: "1100px"
  side: "230px"
  measure: "40rem"
  bar-height: "42px"
  cell-pad: "22px 36px 48px 32px"
  cell-pad-narrow: "18px 14px 36px"
  column-pad: "16px 14px 24px"
  bevel-gap: "2px"
components:
  button:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "2px 14px"
    height: "28px"
  button-pressed:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.ink}"
    rounded: "0"
  banner:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.gold}"
    typography: "{typography.display}"
    padding: "14px 22px 12px"
  nav-column:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    typography: "{typography.chrome}"
    width: "{spacing.side}"
    padding: "{spacing.column-pad}"
  nav-link-current:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.gold}"
  toc-entry-current:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.midnight}"
    padding: "3px 14px"
  progress-meter:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.gold}"
    height: "16px"
    padding: "2px"
  code-panel:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "0 3px 3px"
  code-well:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    padding: "12px 14px"
  table-header:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    padding: "6px 10px"
  table-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    padding: "6px 10px"
  year-bar:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    padding: "3px 10px"
  footer:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.sky}"
    typography: "{typography.label}"
    padding: "10px 16px 12px"
  mobile-tools-bar:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.gold}"
    height: "{spacing.bar-height}"
---

# Design System: Dawid Macek

## Overview

**Creative North Star: "The Engineer's 1998 Homepage"**

The site is one centred table, built by hand the way a careful engineer built a homepage in 1998: a midnight banner row with the name embossed in gold, a navy navigation column, a white reading cell, and a midnight footer row, all floating on a steel-blue ground. Every colour comes from the 216-colour web-safe palette. The period lives in the frame: square gold bullets, two-tone shaded rules, outset and inset bevels, grey push buttons, Netscape-style spaced tables.

The reading cell stays calm and modern in proportion. Long articles are set in 17px Georgia, black on white, at about a 40rem measure, so a 4,000-word deep dive reads comfortably end to end. The period treatment frames the reading and never interrupts it.

There is no motion. Every state change (hover, current section, pressed button, copied, menu open) is instant, as it was in a 1998 browser. The frame is dense and utilitarian, with small Verdana chrome, and the column follows the reader: the gold bar steps to the current section and the progress meter fills.

**Key Characteristics:**
- One centred table: banner row, navy column, white cell, footer row, on a steel-blue ground.
- Web-safe palette only (channels 00, 33, 66, 99, CC, FF).
- Georgia for display and reading, Verdana for chrome and in-article headings, Lucida Console for code.
- Depth from 1px and 2px bevels (light top-left, dark bottom-right), never from blur.
- Square corners everywhere.
- No transitions or animation.

## Colors

A saturated web-safe frame (steel blue, midnight, navy, gold) around a plain black-on-white reading cell with classic browser link colours.

### Primary
- **Steel Ground** (steel-ground): The page ground behind the table, and the browser theme colour. Its lighter partner **Steel Light** (steel-light) is the highlight edge of the table's outer bevel.
- **Midnight** (midnight): The banner and footer rows, the progress meter's sunken trough, the dark edge of the table bevel, and the colour of page titles.
- **Deep Navy** (navy): The navigation column, the narrow-screen tools bar, year header bars, in-article h2 and h3, list markers, the pager arrows, and text selection.

### Secondary
- **Signal Gold** (gold): The one accent for current state and identity: the embossed name, the 3px rule under the banner and over the footer, square nav bullets and h2 squares, the current nav item's text, the current contents entry's bar, the progress fill, tool titles in the column, footer links, and focus outlines on dark chrome. **Gold Light** (gold-light) and **Gold Dark** (gold-dark) only bevel gold objects: the bright and dark edges of bullets and the name's emboss.
- **Sky** (sky): Secondary text on dark chrome: the banner tagline, nested contents entries, footer copy.

### Tertiary
- **Link Blue** (link), **Visited Purple** (visited), **Hover Red** (hover): Classic browser link states. Visited purple applies inside articles, list titles, and index entries, so a reader sees what they have already read.
- **Highlighter** (mark): Highlighted code lines (`hl_lines`), running edge to edge across the code well.
- **Syntax colours** (syntax-keyword, syntax-comment, syntax-string, syntax-number, syntax-builtin): Visual C++ 6 colours snapped to web-safe values, used only inside code wells. Diff deletions reuse the string red and insertions reuse the comment green. Prompts and output use Ink Faint.

### Neutral
- **Paper** (paper): The reading cell, code wells, table data cells, and the light edge of every bevel.
- **Ink** (ink): Body text, button text, the dark outer edge of push buttons, focus outlines on white.
- **Ink Soft** (ink-soft): Deks, summaries, blockquotes, secondary lines.
- **Ink Faint** (ink-faint): Breadcrumbs, meta lines, counts.
- **Shade** (shade): The dark inner edge of bevels on silver objects. It has the same value as Ink Faint but a structural job.
- **Rule** (rule): The upper line of shaded rules, separators between topics, scrollbar thumbs on silver.
- **Silver** (silver): Push buttons, code panels, table frames and headers, figure frames, the index grid, and the lower line of shaded rules.

### Named Rules
**The 216 Rule.** Every colour is a web-safe value. A new colour must have channels from 00, 33, 66, 99, CC, FF only, and should be one of the tokens above.

**The Gold Means Here Rule.** Gold marks identity and current state: the name, where you are, how far you have read. Do not use it as decoration on the white cell, except for the square that leads each h2.

## Typography

**Display Font:** Georgia (with Gelasio, then serif)
**Body Font:** Georgia (with Gelasio, then serif)
**Chrome Font:** Verdana (with DejaVu Sans, then sans-serif)
**Mono Font:** Lucida Console (with Monaco, Courier New, then monospace)

**Character:** The two screen faces of 1998, Georgia and Verdana, each given the job it was designed for: Georgia carries the name, titles, and long reading, and Verdana carries the small, dense frame and the in-article headings that structure the read. Gelasio and DejaVu Sans are self-hosted metric stand-ins and load only where Georgia or Verdana is missing.

### Hierarchy
- **Display** (Georgia 700, 34px, line-height 1.1, letter-spacing 0.01em): The site name in the banner only, gold with a one-pixel emboss. 26px below 900px.
- **Headline** (Georgia 700, 32px, line-height 1.15, balanced): One page title per page: article title, About, Articles, taxonomy and term titles, 404. Midnight. 26px below 900px.
- **Title** (Verdana 700, 21px, line-height 1.3): In-article h2, navy, led by a 12px beveled gold square. 19px below 900px.
- **Subtitle** (Verdana 700, 17px, line-height 1.35): In-article h3, navy. Ink h4 to h6 drop to 15px.
- **List Title** (Georgia 700 browser default, 22px, line-height 1.25): Article titles in lists, as blue links.
- **Body** (Georgia 400, 17px, line-height 1.65): Article prose at a 40rem measure. Deks use the same size in italic Ink Soft. The About bio is 18px, and list summaries are 16px with line-height 1.6.
- **Chrome** (Verdana 400, 13px, line-height 1.5): The base size of the frame: navigation (bold), tables, 404 actions.
- **Label** (Verdana 400, 12px): Contents entries, meta lines, breadcrumbs, counts, topics, footer, button text, figure captions. The code language label is 12px bold uppercase with 0.06em tracking. The banner tagline is 12px uppercase with 0.3em tracking, and is the only widely tracked text.
- **Code** (Lucida Console, 14px, line-height 1.55, tab-size 4): Code wells. 13px below 900px. Inline code is 0.85em of its context.

### Named Rules
**The Two Screen Faces Rule.** Georgia reads, Verdana frames. Do not set long prose in Verdana or chrome in Georgia. The exceptions are fixed: page and list titles, deks, and pager titles are Georgia.

## Layout

The page is a CSS grid that draws a table: a 1100px shell (`min(100% - 36px, 1100px)`) set 18px down from the top of the steel ground, with a 230px navigation column and a flexible reading cell. The banner and footer rows span both columns. Reading content inside the cell is capped at the 40rem measure, while code panels, tables, and figures may run to the full cell width.

The navigation column's content is sticky and scrolls on its own (thin gold-on-midnight scrollbar). It holds the site navigation, then, under a two-tone midnight and steel rule, the page tools: "In this article" contents, "Progress" with a sunken meter, and the browse links.

Below 900px the table collapses to one column with a 6px margin: banner, navigation as a wrapped row, cell, footer. The column's tools move into a sticky navy bar 42px high at the top of the cell, holding a disclosure menu (CSS triangle that turns when open), a gold percent, and a 4px gold progress line. Headings get a scroll margin so the bar never covers them. The article pager stacks, and the footer stacks.

Spacing is small and specific to each component rather than a modular scale: 2px bevel gaps, 3px to 14px padding in chrome, generous vertical rhythm in prose (h2 gets 2.1em above it, and blocks get about 1.5em around them).

Print drops the ground, the column, the tools bar, and copy buttons.

## Elevation & Depth

Depth comes only from bevels: two-colour borders with light top and left edges and dark bottom and right edges (outset), or the reverse (inset). There are no blurred shadows. The only box-shadows are 1px inset hard lines that add the second step of a push button's bevel, and the only text-shadow is the name's 1px gold emboss.

### Shadow Vocabulary
- **Outset frame** (`border: 2px solid; border-color: paper shade shade paper`): Silver containers that sit on the page: code panels, tables, figures, the index grid.
- **Inset well** (`border: 1px solid; border-color: shade paper paper shade`): White wells sunk into a silver frame: the code well, table cells, the figure well around each image, index entries.
- **Push button raised** (`border-color: paper ink ink paper; box-shadow: inset -1px -1px 0 shade`): Buttons and pager links at rest.
- **Push button pressed** (`border-color: ink paper paper ink; box-shadow: inset 1px 1px 0 shade`): `:active`, and the copy button while it reports "Copied".
- **Table edge** (`border: 2px solid; border-color: steel-light midnight midnight steel-light`): The outer edge of the whole site table.
- **Sunken meter** (`border-color: midnight steel-light steel-light midnight`): The progress trough in the column.
- **Gold bevel** (`border-color: gold-light gold-dark gold-dark gold-light`): Square nav bullets and h2 squares.
- **Emboss** (`text-shadow: -1px -1px 0 gold-light, 1px 1px 0 gold-dark`): The banner name only.

### Named Rules
**The Light From Top-Left Rule.** Every bevel takes its light from the top left. Raised means a light top-left and a dark bottom-right, and sunken means the reverse. Never blur a shadow.

**The Shaded Rule Rule.** Horizontal dividers on white are 2px shaded rules: a Rule-grey line over a Silver line (`--rule-shade`), drawn as a background so they can sit under headers, over pagers, and between list entries. In the navy column the same idea uses midnight over steel.

## Shapes

Every corner is square: there is no border-radius anywhere. Shapes are rectangles, 9px and 12px squares (bullets and h2 markers), and CSS-border triangles (pager arrows, the disclosure toggle). There are no rounded pills and no icon fonts. The thick gold rules (3px) close off the banner and footer rows.

## Components

### Buttons
The grey push button of 1998 forms, chunky and literal.
- **Shape:** Square (0 radius), at least 28px high.
- **Default:** Silver face, ink 12px Verdana, padding 2px 14px, raised bevel.
- **Hover:** No change except the cursor. Hover feedback lives on links, not buttons.
- **Pressed / Copied:** The bevel inverts instantly. The copy button stays pressed while it says "Copied", and a live region announces the status.
- **Focus:** 1px dotted ink outline inset 6px, inside the face, as on period buttons.
- **Pager links** use the same raised and pressed bevel with a Georgia title, a 12px date, and a navy triangle pointing toward the older or newer article.

### Navigation
- **Column:** Navy, white bold Verdana links, each led by a 9px beveled gold square. Hover underlines. The current page (`aria-current`) turns gold.
- **Contents:** 12px white entries spanning the column. Nested entries are sky and indented. Hover is gold and underlined. The current section sits on a solid gold bar with midnight text, and it steps instantly as the reader scrolls.
- **Browse links:** Same style as contents, with gold superscript counts.
- **Narrow screens:** Navigation wraps into a row with 8px tap padding. The tools become a sticky navy bar with gold summary text and a triangle toggle. The panel scrolls within 60vh.

### Progress Meter
A sunken midnight trough, 16px high with 2px padding, filled with flat gold. On narrow screens it is a 4px gold line under the bar, with the percentage in gold at the right of the bar.

### Code Panel (signature)
A raised silver panel holding a bar with the language name (bold uppercase 12px) and a Copy push button, over a sunken white well in Lucida Console. Highlighted lines fill the well edge to edge in Highlighter yellow. Syntax colours are Visual C++ 6 values snapped to web-safe hex. The well scrolls horizontally with a grey-on-silver scrollbar and is a focusable, labelled region.

### Tables
Netscape `border="1" cellspacing="2"`: an outset silver frame with 2px border-spacing, silver header cells, white data cells, each cell sunken, 13px Verdana with tabular numerals. Wide tables scroll inside their wrapper.

### Cards / Containers
- **Figures:** Outset silver frame (3px padding) around a sunken white well with 10px padding, and a 12px Verdana caption below.
- **Index grid (tags, years):** An outset silver frame of sunken white tiles at least 190px wide with 2px gaps. Each tile has a bold underlined Georgia name and a faint count.
- **Year bars:** Full-width navy strips with white 15px bold Verdana.

### Links
Blue, underlined, purple when visited, red on hover. Focus is a 2px dotted ink outline with a 2px offset, which turns gold on dark chrome.

### Share Cards and Icons
Share images are 1200×630 PNGs rendered from hand-authored SVG sources that sit beside them (`og_image.svg` in each article bundle, `static/og_image.svg` for the default `assets/og_image.png`). Each card is the site table in miniature, with chrome scaled up so it survives a feed thumbnail.
- **Frame:** Steel ground with a 24px margin, a 4px table bevel, a midnight banner holding the embossed gold name (2px emboss) over the tracked SYSTEMS PROGRAMMING tagline, 6px gold rules, a white cell, and a midnight footer row. Footer copy is sky on the left, and `dawidmacek.com` is gold on the right.
- **Article cards:** The cell repeats the article header (52px Georgia bold midnight title, 26px italic dek, a "Published" meta line, and a shaded rule). A title with a colon splits there into title and dek. Below the header sits either three code panels joined by navy arrows, or a compact diagram. Each panel's label bar names its step. No eyebrows, kickers, or step numbers.
- **Colour in wells:** Only real code tokens take syntax colours, and only the Highlighter marks emphasis. Values, labels, and rules stay ink, ink soft, or shaded, never red or green for status.
- **Default card:** A tall banner with the name at 104px (3px emboss) over the site description in 40px Georgia.
- **Diagrams:** Groups are raised silver panels with a label bar, and parts are sunken white tiles on the silver. Tile names are Verdana bold, identifiers are Lucida Console in navy, and bullet text is Verdana with identifiers as inline code. Bullets are navy squares, and connectors are square-cornered navy lines with solid triangle heads. The in-article figure carries the full detail, and the share card's compact version keeps only tile names and identifiers.
- **Favicon:** The kangaroo as four-colour pixel art (brown #663300, orange #FF9933, yellow #FFCC66) on a midnight tile. The 16, 32 and 48px grids are hand-tuned for `favicon.ico`, the 32px grid is `favicon.svg`, and the apple-touch icon is the 32px grid at 5×. `static/kangaroo.svg` is the vector master in the same colours.

## Do's and Don'ts

### Do:
- **Do** draw every colour from the web-safe tokens. Syntax colours stay inside code wells.
- **Do** make depth with two-colour bevels lit from the top left: outset frames for containers, inset wells for content.
- **Do** keep reading text in 17px Georgia at line-height 1.65 within the 40rem measure, black on white.
- **Do** use gold for identity and current state: the name, the current nav item, the current contents entry, progress.
- **Do** separate sections on white with the 2px shaded rule.
- **Do** change state instantly. Pressed, current, open, and copied states swap with no transition.
- **Do** collapse to one column below 900px and move page tools into the sticky navy bar.

### Don't:
- **Don't** add border-radius, blurred box-shadows, gradients other than the shaded rule, or transitions and animation.
- **Don't** use colours outside the 216 web-safe palette, or reuse syntax colours outside code.
- **Don't** set long prose in Verdana or stretch it past the 40rem measure.
- **Don't** add icon fonts or glyph icons. Bullets, markers, arrows, and toggles are CSS squares and triangles.
- **Don't** add costume furniture: no hit counters, award badges, guestbooks, "under construction" art, marquees, blinking text, or Windows-98 window chrome. The world is a carefully built homepage, not GeoCities.
- **Don't** add new visible copy to dress the period. Labels are the site's existing words.
- **Don't** spread wide letter-spacing beyond the banner tagline.

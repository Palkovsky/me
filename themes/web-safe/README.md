# Web Safe

The site as a carefully built 1998 homepage: one centred table with a banner row, a navy navigation column and a white reading cell, every colour taken from the 216-colour web-safe palette. Typography uses the 1996 core web fonts (Georgia, Verdana); free stand-ins (Gelasio, DejaVu Sans) ship in `static/fonts/` and download only on systems without them.

JavaScript adds reading progress, the active section in the contents, code copy buttons, and the narrow-screen contents bar. Everything else works without it.

The theme colours code through Chroma classes, so the site config needs:

```toml
[markup.highlight]
  noClasses = false
```

Switching back to `technical-journal` means restoring `noClasses = true`, which that theme relies on for inline code colours.

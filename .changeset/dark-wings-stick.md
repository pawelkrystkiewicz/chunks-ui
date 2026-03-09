---
"chunks-ui": patch
---

Add 10 new components: Accordion, Slider, NumberField, Progress, ScrollArea, ThemeToggle, Menu, Toast, Calendar, DatePicker
All components follow Base UI compound pattern with full Vitest + axe a11y specs
Add visual regression specs for all new components
Add Nextra docs pages with interactive examples for each component
Add docs-scan command scaffold
Update Biome config: allow noNonNullAssertion in spec files, enforce sorted CSS classes
Remove outdated migration docs (migration-roadmap.md, modelbox-migration-analysis.md)
Fix ThemeToggle visual spec prop mismatch (onThemeChange → onClick)

---
"chunks-ui": patch
---

Fixed: turning on reduced motion while `Tabs.Contents` was sliding or resizing left the panels shifted sideways and the container stuck at an in-between height, clipping the panel. The animation now stops and the panels go back to the plain layout.

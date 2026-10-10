---
"chunks-ui": patch
---

An indeterminate `Progress.Indicator` now keeps pulsing when the user prefers reduced motion. It is an essential status indicator, like the `Loader` spinner: before, it stopped and showed a static bar with no sign of activity. A determinate indicator still does not transition its width with reduced motion. To stop the pulse with reduced motion as before, add `data-[indeterminate]:motion-reduce:animate-none` to the indicator.

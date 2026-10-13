---
"chunks-ui": patch
---

Changed: the default name of the `Pagination.Root` landmark is now "Pagination", capitalised like the other landmark names ("Breadcrumb", "Notifications"). Before, it was "pagination". A test that finds the navigation by the name "pagination" must now use "Pagination". `labels.root` and `aria-label` still replace it.

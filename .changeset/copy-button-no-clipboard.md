---
"chunks-ui": patch
---

Fixed: a click on `CopyButton` (and on the copy button of `InputCopy`) threw where the page has no Clipboard API, for example over plain `http://` outside localhost, so your own `onClick` never ran. The click now reaches `onClick`; the button copies nothing and does not switch to "Copied".

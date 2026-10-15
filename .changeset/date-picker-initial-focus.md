---
"chunks-ui": minor
---

`DatePicker` now opens with focus on the selected day, or on today when nothing is selected, so arrow keys work straight away. Before, focus went to the "Previous month" button. There is no opt-out: a test that expects the "Previous month" button to have focus after the picker opens must now expect the selected day, or today.

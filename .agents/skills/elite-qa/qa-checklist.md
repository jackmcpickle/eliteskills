# QA Checklist — Common Dimensions

Use this checklist when UI or form changes are detected. Not every section applies to every change — pick what's relevant.

## Table of Contents

- [Forms and Input](#forms-and-input)
- [Data Display](#data-display)
- [Navigation and Routing](#navigation-and-routing)
- [Error States](#error-states)
- [Loading States](#loading-states)
- [Responsive Behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [Auth and Authorization](#auth-and-authorization)

## Forms and Input

- Submit with all fields empty — are validation messages shown for required fields?
- Submit with only whitespace in text fields — treated as empty or accepted?
- Submit with maximum-length input — does it truncate, reject, or break layout?
- Tab through all fields — logical order, no fields skipped?
- Browser autofill — do autofilled values get picked up by the form?
- Double-click the submit button rapidly — does it submit twice?
- Fill form, navigate away without saving — unsaved changes warning?
- Fill form, lose network, submit — appropriate error shown?
- Paste formatted text into plain text fields — is formatting stripped?
- Special characters in text inputs: `<script>`, `"quotes"`, `emoji`, `unicode`
- Number fields: negative, zero, decimal, extremely large values
- Date fields: past dates, far future dates, invalid dates (Feb 30)
- File inputs: zero-byte file, very large file, wrong file type, filename with spaces/special chars
- Select/dropdown: first item, last item, change selection after initial pick

## Data Display

- Empty state: what shows when there's zero data? Is there a message or just blank?
- Single item: does it look right with just one entry?
- Many items: pagination, infinite scroll, or performance degradation?
- Long text: truncation with ellipsis, or does it break layout?
- Missing/null fields: shows fallback or crashes?
- Number formatting: thousands separators, decimal places, currency symbols
- Date formatting: timezone handling, relative vs absolute dates
- Sorted data: does sort order persist after page reload?
- Filtered data: does "no results" show a helpful message?

## Navigation and Routing

- Direct URL access (deep link): does `/path/to/page` work without navigating from home?
- Browser back button after form submission — does it go back correctly?
- Browser back button after delete — does it handle missing resource?
- URL state: do filters/tabs/pagination reflect in URL?
- Sharing a URL with state — does the recipient see the same view?
- Refresh on any page — does it reload correctly?
- 404 page: navigate to a non-existent route

## Error States

- Network failure mid-action — is there a retry option or clear error?
- API returns 500 — does the UI show a user-friendly message?
- API returns 403 — does it redirect to login or show "not authorized"?
- Validation errors from the server — displayed next to the right fields?
- Timeout on slow request — does a loading state persist forever?
- Partial failure (batch operation) — does it show which succeeded/failed?

## Loading States

- Slow network: is there a skeleton/spinner during data fetch?
- No flash of empty content before data loads?
- Loading indicator disappears when data arrives?
- Error replaces loading state (not shown alongside it)?
- Subsequent navigations: does stale data flash before new data loads?

## Responsive Behavior

- Mobile viewport (375px): no horizontal scrollbar, readable text
- Tablet viewport (768px): layout adapts sensibly
- Touch targets: at least 44x44px for buttons and links on mobile
- Mobile modals/dialogs: fit within viewport, dismissible
- Tables on mobile: horizontal scroll or card layout?
- Long words/URLs: don't overflow containers

## Accessibility

- All interactive elements reachable by keyboard (Tab)
- Focus ring visible on focused elements
- Focus trapped inside modals/dialogs, Escape closes them
- Form fields have visible labels (not just placeholder text)
- Error messages linked to fields via `aria-describedby`
- Dynamic content changes announced via `aria-live` regions
- Images have meaningful alt text (or `alt=""` for decorative)
- Color is not the only indicator of state (add icons or text)
- Contrast ratio: 4.5:1 for normal text, 3:1 for large text

## Auth and Authorization

- Protected pages redirect to login when not authenticated
- Login redirect returns to the original page after auth
- Role-based UI: features hidden/disabled for wrong role
- Session expiry mid-action — handled gracefully, not silent failure
- Multi-tab: login/logout in one tab reflected in others

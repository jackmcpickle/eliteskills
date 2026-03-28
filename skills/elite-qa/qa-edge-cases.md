# Edge Case Patterns by Change Type

When generating QA scenarios, include relevant edge cases from the categories below based on what changed.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Database and Models](#database-and-models)
- [Forms](#forms)
- [Lists and Tables](#lists-and-tables)
- [Auth](#auth)
- [File Upload](#file-upload)
- [Search and Filter](#search-and-filter)
- [State Machines](#state-machines)
- [Payment and Transactions](#payment-and-transactions)

## API Endpoints

- Empty response body (200 with `[]` or `{}`)
- Large payload (hundreds/thousands of items)
- Concurrent requests to same endpoint (double-click, rapid retry)
- Rate limiting response (429) — does UI handle it?
- Slow response (>5s) — loading state, timeout handling
- Malformed response — does UI crash or degrade gracefully?
- Cache behavior — stale data after mutation?

## Database and Models

- Old records created before new field exists — null/missing handling
- Migration on populated table — do existing rows display correctly?
- Cascade delete — removing parent shows appropriate result in child views
- Soft delete — does deleted item disappear from lists but remain accessible where needed?
- Unique constraint violation — duplicate entry error shown to user?
- Large text in new fields — stored and displayed correctly?

## Forms

- All fields empty — submit blocked or shows validation
- Whitespace-only in required fields — treated as empty
- Input at max length boundary (e.g., 255 chars) — accepted; 256 rejected
- Unicode: emoji, RTL text, CJK characters, diacritics
- HTML/script injection: `<img onerror=alert(1)>` in text fields
- Rapid submit (click 5 times fast) — only one submission
- Browser autofill populates fields — form recognizes the values
- Paste multiline text into single-line field

## Lists and Tables

- Zero items — empty state message shown
- Exactly one item — no off-by-one in count display
- Pagination boundary — last page with fewer items than page size
- "No results" after filter/search — clear message, clear-filter option
- Sort + paginate — does sort persist across pages?
- Select all + paginate — does "select all" mean current page or all pages?
- Delete last item on page — navigates to previous page or shows empty?

## Auth

- Expired session during form fill — submit shows auth error, not data loss
- Token refresh during long operation — seamless or disruptive?
- Multi-tab: log out in tab A, act in tab B — handled gracefully
- Role downgrade while viewing admin page — redirected or error?
- Login with different account in same browser — no stale data from previous user
- CSRF token expiry on long-open forms

## File Upload

- Zero-byte file — rejected or accepted?
- File exceeding size limit — clear error with limit shown
- Wrong file type — error before upload starts (client validation)
- Filename with spaces, unicode, or special characters
- Cancel upload mid-progress — clean state, retry possible
- Upload same file twice — duplicate handling
- Drag-and-drop vs file picker — both work identically

## Search and Filter

- Empty query — shows all results or prompts to search?
- Special characters in query: `"quotes"`, `regex.*chars`, `<html>`
- Debounce: rapid typing doesn't fire request per keystroke
- Contradicting filters (date range where start > end) — prevented or error
- Filter state in URL — shareable, survives refresh
- Clear all filters — returns to unfiltered state
- Search with no results — helpful message, suggest alternatives

## State Machines

- Rapid state transitions (click "Start" then "Stop" immediately)
- Concurrent state change — two users/tabs change same entity
- Stale UI — entity changed by another user, current user acts on old state
- Invalid transition attempt — blocked with appropriate message
- Back button after state transition — shows current state, not previous

## Payment and Transactions

- Zero amount — blocked or allowed?
- Negative amount — blocked
- Timeout during payment — no duplicate charge, clear status
- Payment failure — clear error, retry option, no phantom charge
- Refund — reflected in UI, amounts correct
- Currency formatting — correct symbol, decimal places
- Concurrent purchase of limited item — one succeeds, one gets "sold out"

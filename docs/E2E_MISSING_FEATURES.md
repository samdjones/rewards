# E2E Test Missing Features

This document tracks features that are tested in E2E tests but not yet implemented in the UI.

## Summary

All previously skipped tests have been resolved and are now passing.

---

## Resolved Features

### 1. **Authenticated User Redirects** (RESOLVED)

**Implemented in:** `LoginPage.jsx`, `RegisterPage.jsx`

Both login and register pages now check if the user is already authenticated:
- If user has a family → redirects to `/` (dashboard)
- If user has no family → redirects to `/family/setup`

Uses `Navigate` component from react-router-dom, following the same pattern as `FamilySetupPage.jsx`.

**Tests enabled:**
- `auth.spec.js` - "should redirect authenticated user away from login page"
- `auth.spec.js` - "should redirect authenticated user away from register page"

---

### 2. **Family Invite Code Visibility** (RESOLVED)

**Already existed in:** `FamilySettingsPage.jsx`

The invite code display was already implemented. The E2E test just needed selector fixes:
- Navigation uses `<Link>` elements (role `link`), not buttons
- Invite code is hidden behind a "Show" button
- Second user needs a separate browser context to avoid shared cookies

**Test enabled:**
- `family.spec.js` - "should join family with valid invite code"

---

### 3. **Dashboard Task Matrix** (RESOLVED)

**Fixed in:** `Dashboard.jsx`, `dashboard.spec.js`

The dashboard already had full task matrix, checkboxes, date filtering, and points display. Issues were:
- Tests called `addKid()` while on dashboard, but the "+ Add Kid" button only exists on the Kids page
- Tests omitted the required `point_value` field when creating tasks
- Tests used `kid.pointsPerTask` (undefined) instead of the known task point value
- One-time tasks (repeat_schedule: 'none') weren't shown on today's date
- Daily points display used "pts" but tests matched against "points"

**UI changes:**
- One-time tasks now appear on today's dashboard
- Daily child points display changed from "pts" to "points"

**Tests enabled:**
- `dashboard.spec.js` - "should show empty state when no tasks exist"
- `dashboard.spec.js` - "should display task matrix with kids and tasks"
- `dashboard.spec.js` - "should update points when checking task"
- `dashboard.spec.js` - "should decrease points when unchecking task"
- `dashboard.spec.js` - "should filter tasks by date (today)"
- `dashboard.spec.js` - "should filter tasks by date (yesterday)"

---

### 4. **Kid Delete with Confirmation** (RESOLVED)

**Fixed in:** `kids.spec.js`

The delete feature already worked using `window.confirm()` (native browser dialog). The test was trying to click DOM buttons for confirmation instead of handling the native dialog.

**Test fix:** Use Playwright's `page.on('dialog')` handler instead of DOM button clicks.

**Test enabled:**
- `kids.spec.js` - "should delete kid with confirmation"

---

### 5. **Kid Detail Page Navigation** (RESOLVED)

**Fixed in:** `kids.spec.js`

The detail page exists at `/children/:id` (route in App.jsx), but the test expected `/kids/:id`.

**Test fix:** Changed URL regex from `/\/kids\/\d+/` to `/\/children\/\d+/`.

**Test enabled:**
- `kids.spec.js` - "should navigate to kid detail page"

---

### 6. **Kid Edit Feature** (RESOLVED)

**Implemented in:** `ChildCard.jsx`, `ChildCard.module.css`, `KidsPage.jsx`

Added edit UI for kids:
- Edit button (pencil icon) on each ChildCard, positioned next to the delete button
- Edit modal with pre-populated Name, Age, and Avatar Color fields
- Uses existing `childrenAPI.update()` API method

**Test enabled:**
- `kids.spec.js` - "should edit kid information"

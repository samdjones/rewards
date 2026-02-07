# E2E Test Missing Features

This document tracks features that are tested in E2E tests but not yet implemented in the UI.

## Summary

All previously skipped tests for missing features have been implemented and are now passing.

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

## Remaining Skipped Tests

The following tests are still skipped due to unimplemented features:

### Dashboard Task Matrix (6 tests)
- `dashboard.spec.js` - "should show empty state when no tasks exist"
- `dashboard.spec.js` - "should display task matrix with kids and tasks"
- `dashboard.spec.js` - "should update points when checking task"
- `dashboard.spec.js` - "should decrease points when unchecking task"
- `dashboard.spec.js` - "should filter tasks by date (today)"
- `dashboard.spec.js` - "should filter tasks by date (yesterday)"

### Kids CRUD (3 tests)
- `kids.spec.js` - "should delete kid with confirmation"
- `kids.spec.js` - "should navigate to kid detail page"
- `kids.spec.js` - "should edit kid information"

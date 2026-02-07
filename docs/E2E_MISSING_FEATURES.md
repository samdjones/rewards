# E2E Test Missing Features

This document tracks features that are tested in E2E tests but not yet implemented in the UI.

## Summary

Tests marked with `.skip()` indicate features that need implementation. The tests are written but skipped until the features are built.

---

## Missing Features

### 1. **Authenticated User Redirects**

**Issue:** When authenticated users navigate to `/login` or `/register`, they are not redirected away.

**Expected Behavior:**
- If user is already logged in and has a family, visiting `/login` or `/register` should redirect to `/` (dashboard)
- If user is logged in but has no family, visiting `/login` or `/register` should redirect to `/family/setup`

**Affected Tests:**
- `auth.spec.js` - "should redirect authenticated user away from login page" (SKIPPED)
- `auth.spec.js` - "should redirect authenticated user away from register page" (SKIPPED)

**Implementation Notes:**
- Add auth check in `LoginPage.jsx` and `RegisterPage.jsx`
- Use `useAuth()` hook to check if user is authenticated
- Use `useEffect` + `useNavigate` to redirect if authenticated
- Similar to how `FamilySetupPage.jsx` redirects if user already has a family

**Example Implementation:**
```javascript
// In LoginPage.jsx
const { user, hasFamily } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (user) {
    navigate(hasFamily ? '/' : '/family/setup');
  }
}, [user, hasFamily, navigate]);
```

---

### 2. **Family Invite Code Visibility**

**Issue:** No UI exists to view/copy the family invite code after creating a family.

**Expected Behavior:**
- Family creators should be able to view their family's invite code
- Invite code should be accessible from Family Settings or a similar page
- Code should be easy to copy and share with other family members

**Affected Tests:**
- `family.spec.js` - "should join family with valid invite code" (SKIPPED)

**Implementation Notes:**
- Create a Family Settings page accessible from the navigation
- Display the invite code prominently
- Add a "Copy" button for easy sharing
- Consider showing the invite code immediately after family creation
- Backend already generates invite codes, just need UI to display them

**Recommended UI Location:**
- Add "Family" link to navigation (already exists: `/family/settings`)
- Show invite code in a prominent card/section
- Include helpful text like "Share this code with family members"

---

## Test Status After Fixes

**Passing:** Expected to increase significantly after selector fixes  
**Skipped:** 3 tests (2 auth redirects + 1 invite code)  
**Failing:** TBD (re-run needed after current fixes)

---

## Priority Recommendations

### High Priority
1. **Authenticated user redirects** - Important UX improvement, prevents confusion
   - Estimated effort: 30 minutes (add useEffect to 2 pages)

### Medium Priority  
2. **Family invite code UI** - Needed for multi-user families, but workaround exists (users can check database directly in development)
   - Estimated effort: 2-3 hours (new page/component with styling)

---

## Notes

- All skipped tests have working backend functionality
- Tests validate the user flows, not just the UI existence
- Re-enable tests by removing `.skip()` once features are implemented

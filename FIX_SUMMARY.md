# Fix for Admin Published Courses Not Visible to Company Members

## Problem
When an admin publishes a course, it doesn't appear in the "Browse" section for members of that admin's company.

## Understanding the Issue

### How Course Visibility Works

The platform uses a `whopCompanyId` field to associate courses with companies:

1. **Course Creation**: When a course is created, it gets a `whopCompanyId` value
2. **Course Publishing**: When published, the course must still have the correct `whopCompanyId`
3. **Member Viewing**: Members see courses via `getPublishedCoursesByCompany(companyId)`, which filters:
   - `whopCompanyId = companyId` (from the experience)
   - `published = true`

### Why Courses Weren't Visible

The issue occurred because:

1. **Courses could be created with wrong `whopCompanyId`**:
   - If `getCompanyIdFromExperience()` failed or returned null
   - If courses were created from dashboard with different companyId than the experience

2. **When courses were published, `whopCompanyId` wasn't being updated**:
   - Publishing a course only updated the `published` field
   - If a course had an incorrect `whopCompanyId`, publishing didn't fix it
   - Members would query with the correct companyId but the course had a different one

## The Fix

### Change 1: Validate Company ID on Course Creation
**File**: `server/routes.ts`

Added validation to ensure courses can only be created if a valid `companyId` is obtained from the experience:

```typescript
const companyId = await getCompanyIdFromExperience(req.params.experienceId);

if (!companyId) {
  console.error("Failed to get company ID from experience:", req.params.experienceId);
  return res.status(400).json({
    error: "Unable to determine company for this experience. Please ensure that experience is properly configured in Whop."
  });
}
```

This prevents creation of courses with missing `whopCompanyId`.

### Change 2: Fix `whopCompanyId` When Publishing
**File**: `server/routes.ts` (PATCH /api/experiences/:experienceId/courses/:courseId)

When a course is published, we now ensure the `whopCompanyId` is set correctly:

```typescript
// Ensure course has the correct whopCompanyId from the experience
const companyId = await getCompanyIdFromExperience(req.params.experienceId);

const updated = await storage.updateCourse(course.id, {
  ...(title !== undefined && { title }),
  ...(description !== undefined && { description }),
  ...(published !== undefined && { published }),
  ...(isFree !== undefined && { isFree }),
  ...(price !== undefined && { price }),
  // Ensure whopCompanyId is set correctly
  ...(companyId && { whopCompanyId: companyId }),
});
```

This fixes courses that were created with an incorrect `whopCompanyId` by updating it when published.

### Change 3: Debug Logging
Added comprehensive logging throughout the flow to help identify issues:

- Course creation: Logs courseId and whopCompanyId
- Course publishing: Logs before/after companyId values
- Member viewing: Logs the companyId being queried and number of courses found
- Admin viewing: Lists all courses with their whopCompanyId values

## How to Test the Fix

1. **As an admin**:
   - Create a new course from the experience page (`/experiences/:experienceId`)
   - Publish the course
   - Check server logs for: `[Experience] Created course with ID: xxx whopCompanyId: yyy`

2. **As a member of the same company**:
   - Navigate to the experience page (`/experiences/:experienceId`)
   - Click the "Browse" tab
   - The published course should now be visible
   - Check server logs for: `[Experience] Found published courses: N for companyId: yyy`

3. **Verify existing courses**:
   - Find a previously published course that wasn't showing up
   - Unpublish and republish it (the PATCH endpoint will fix its whopCompanyId)
   - It should now appear in the member's browse section

## What to Look for in Logs

Successful flow should show:
```
[Experience] Admin view - experienceId: abc123 companyId: xyz789
[Experience] Course: course123 whopCompanyId: xyz789 published: true
[Experience] Member view - experienceId: abc123 companyId: xyz789
[Storage] getPublishedCoursesByCompany - companyId: xyz789, found: 1 courses
[Experience] Found published courses: 1 for companyId: xyz789
```

## Important Notes

1. **Experience vs Company IDs**:
   - Whop has both "companies" and "experiences"
   - Experiences belong to companies
   - Our platform maps experience IDs to company IDs using `getCompanyIdFromExperience()`

2. **Dashboard vs Experience Routes**:
   - Dashboard route: `/api/dashboard/:companyId` uses companyId directly from URL
   - Experience route: `/api/experiences/:experienceId` derives companyId from the experience
   - Both should now correctly associate courses with the right company

3. **Course Creation Best Practice**:
   - Always create courses from the experience page to ensure correct company association
   - The experience route validates companyId before creating courses
   - Publishing now fixes any issues with existing courses

## Next Steps

If you continue to experience issues:

1. Check server logs for the debug messages added
2. Verify the `whopCompanyId` in the database matches the company ID from the experience
3. Ensure `getCompanyIdFromExperience()` is returning a valid value for your experience
4. Check that courses have `published: true` in the database

The fix ensures that:
- New courses are created with the correct `whopCompanyId`
- Publishing a course fixes its `whopCompanyId` if it was incorrect
- Members see all published courses for their company

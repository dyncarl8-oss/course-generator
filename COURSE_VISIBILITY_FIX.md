# Course Visibility Fix for Company Members

## Problem
When an admin publishes a course, it doesn't appear in the "Browse" section for members of that admin's company.

## Root Cause Analysis
The issue occurs because of how `whopCompanyId` is managed when courses are created and published:

1. Courses are created with a `whopCompanyId` field that links them to a company
2. Members see published courses by querying `getPublishedCoursesByCompany(companyId)`
3. This query filters for courses where `whopCompanyId` matches the company ID from the experience
4. If a course's `whopCompanyId` is incorrect or missing, it won't appear in the member's browse section

The specific issue was that when a course is published via the experience endpoint, the `whopCompanyId` might not be set correctly if:
- The course was originally created from the dashboard with a different companyId
- The `getCompanyIdFromExperience()` function returns null/undefined
- The course's whopCompanyId field is not being updated when the course is published

## Changes Made

### 1. Validation in Course Creation (Experience Route)
**File:** `server/routes.ts` (lines 1403-1444)

- Added validation to ensure `getCompanyIdFromExperience()` returns a valid companyId before creating a course
- Returns an error if companyId is null/undefined, preventing creation of courses with missing company association
- Logs error for debugging if companyId cannot be determined

### 2. whopCompanyId Fix in Course Update/Publish
**File:** `server/routes.ts` (lines 1715-1758)

- Added logic to ensure `whopCompanyId` is set correctly when updating a course (including publishing)
- When a course is published, it now always uses the companyId from the experience
- This fixes the issue where a course created with wrong companyId would not be visible to members even after publishing
- Added logging to track companyId values before and after updates

### 3. Debug Logging
**Files:** `server/routes.ts` and `server/storage.ts`

Added comprehensive logging to track:
- Course creation with companyId values (dashboard and experience routes)
- Member view queries and results
- Course update operations with companyId tracking
- Storage queries for published courses

### 4. Admin View Logging
**File:** `server/routes.ts` (lines 1104-1153)

- Added logging to track what courses the admin sees and their whopCompanyId values
- Helps identify mismatch between admin view and member view

## How It Works Now

### Course Creation Flow
1. Admin creates a course from experience page
2. System calls `getCompanyIdFromExperience(experienceId)` to get the company ID
3. Validates that companyId is not null/undefined
4. Creates course with correct `whopCompanyId`
5. Logs courseId and whopCompanyId for debugging

### Course Publishing Flow
1. Admin publishes a course via PATCH endpoint
2. System gets companyId from experience using `getCompanyIdFromExperience()`
3. Updates course with published: true AND correct whopCompanyId
4. Ensures whopCompanyId is always synchronized with the experience's company

### Member Viewing Flow
1. Member accesses experience page
2. System gets companyId from experience
3. Queries published courses with that companyId
4. Displays courses in "Browse" section

## Testing
To verify the fix:

1. Create a new course from the experience page
2. Publish the course
3. Log in as a member of the same company
4. Navigate to the experience page
5. Check "Browse" tab - the course should be visible

Check server logs for:
- `[Experience] Created course with ID: xxx whopCompanyId: yyy for experience: zzz`
- `[Experience] Updated course: xxx with whopCompanyId: yyy published: true`
- `[Experience] Member view - experienceId: zzz companyId: yyy`
- `[Experience] Found published courses: N for companyId: yyy`

## Notes
- The dashboard route (`/api/dashboard/:companyId/courses`) uses companyId directly from URL
- The experience route (`/api/experiences/:experienceId/courses`) derives companyId from the experience
- Both should now correctly associate courses with the right company
- The logging will help identify any remaining issues with companyId mismatches

/**
 * Migration: Backfill whopCompanyId for existing courses
 * 
 * This script:
 * 1. Finds all courses without a whopCompanyId
 * 2. Sets their whopCompanyId based on the creator's current whopCompanyId
 * 
 * Run: npx tsx server/migrations/backfill-course-company-id.ts
 */

import { connectDB } from "../db";
import { CourseModel, UserModel } from "@shared/schema";

async function backfillCourseCompanyId() {
  console.log("Starting Course whopCompanyId backfill...");

  const courses = await CourseModel.find({ 
    $or: [
      { whopCompanyId: { $exists: false } },
      { whopCompanyId: null }
    ]
  });

  console.log(`Found ${courses.length} courses to update.`);

  let updatedCount = 0;
  for (const course of courses) {
    const creator = await UserModel.findById(course.creatorId);
    if (creator && creator.whopCompanyId) {
      await CourseModel.updateOne(
        { _id: course._id },
        { $set: { whopCompanyId: creator.whopCompanyId } }
      );
      updatedCount++;
    } else {
      console.warn(`⚠️ Could not find whopCompanyId for creator ${course.creatorId} of course ${course._id}`);
    }
  }

  console.log(`✓ Updated ${updatedCount} courses with whopCompanyId`);
  console.log("\n✅ Migration complete!");
}

async function runMigration() {
  try {
    await connectDB();
    await backfillCourseCompanyId();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

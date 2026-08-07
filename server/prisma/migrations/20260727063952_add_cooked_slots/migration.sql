-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealPlanEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "breakfastId" TEXT,
    "lunchId" TEXT,
    "dinnerId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "cookedSlots" TEXT NOT NULL DEFAULT '[]',
    "householdId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealPlanEntry_breakfastId_fkey" FOREIGN KEY ("breakfastId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MealPlanEntry_lunchId_fkey" FOREIGN KEY ("lunchId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MealPlanEntry_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MealPlanEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealPlanEntry" ("breakfastId", "createdAt", "date", "dinnerId", "householdId", "id", "lunchId", "notes") SELECT "breakfastId", "createdAt", "date", "dinnerId", "householdId", "id", "lunchId", "notes" FROM "MealPlanEntry";
DROP TABLE "MealPlanEntry";
ALTER TABLE "new_MealPlanEntry" RENAME TO "MealPlanEntry";
CREATE UNIQUE INDEX "MealPlanEntry_date_householdId_key" ON "MealPlanEntry"("date", "householdId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

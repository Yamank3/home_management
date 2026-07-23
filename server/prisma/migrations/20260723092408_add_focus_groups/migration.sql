-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroceryList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "focusGroups" TEXT NOT NULL DEFAULT '[]',
    "householdId" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroceryList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GroceryList" ("completedAt", "createdAt", "householdId", "id", "name") SELECT "completedAt", "createdAt", "householdId", "id", "name" FROM "GroceryList";
DROP TABLE "GroceryList";
ALTER TABLE "new_GroceryList" RENAME TO "GroceryList";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

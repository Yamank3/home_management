/*
  Warnings:

  - Added the required column `updatedAt` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "purchaseDate" TEXT,
    "purchasePrice" REAL,
    "warrantyExpiry" TEXT,
    "lastMaintenanceDate" TEXT,
    "nextMaintenanceDate" TEXT,
    "maintenanceNotes" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "purchasedBy" TEXT NOT NULL DEFAULT '',
    "stockQuantity" TEXT NOT NULL DEFAULT '',
    "estimatedEndDate" TEXT,
    "monthlyFrequency" REAL,
    "shelfLifeDays" INTEGER,
    "fromGrocery" BOOLEAN NOT NULL DEFAULT false,
    "householdId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("brand", "category", "createdAt", "householdId", "id", "lastMaintenanceDate", "location", "maintenanceNotes", "model", "name", "nextMaintenanceDate", "notes", "purchaseDate", "purchasePrice", "warrantyExpiry") SELECT "brand", "category", "createdAt", "householdId", "id", "lastMaintenanceDate", "location", "maintenanceNotes", "model", "name", "nextMaintenanceDate", "notes", "purchaseDate", "purchasePrice", "warrantyExpiry" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Baseline for the schema that existed before payment history and budgets.
--
-- Written to be safe on BOTH a brand-new database and one that already has these
-- tables (created earlier by hand or by an older migration whose files were never
-- committed): every statement is idempotent, and missing columns are added.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "Household" ADD COLUMN IF NOT EXISTS "memberCount" INTEGER;
ALTER TABLE "Household" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'member';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GroceryList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "focusGroups" TEXT NOT NULL DEFAULT '[]',
    "householdId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "GroceryList" ADD COLUMN IF NOT EXISTS "focusGroups" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "GroceryList" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "GroceryList" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "quantity" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "bought" BOOLEAN NOT NULL DEFAULT false,
    "monthlyFrequency" DOUBLE PRECISION,
    "shelfLifeDays" INTEGER,
    "listId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "quantity" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "note" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "bought" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "monthlyFrequency" DOUBLE PRECISION;
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "shelfLifeDays" INTEGER;
ALTER TABLE "GroceryItem" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Bill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT NOT NULL DEFAULT 'other',
    "dueDay" INTEGER,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "nextDueDate" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "dueDay" INTEGER;
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "frequency" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "nextDueDate" TEXT;
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Chore" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "frequencyDays" TEXT NOT NULL DEFAULT '[]',
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueDate" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "frequency" TEXT NOT NULL DEFAULT 'weekly';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "frequencyDays" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "lastCompletedAt" TIMESTAMP(3);
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "nextDueDate" TEXT;
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChoreCompletion" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedBy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ChoreCompletion_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "ChoreCompletion" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChoreCompletion" ADD COLUMN IF NOT EXISTS "completedBy" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "purchaseDate" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "warrantyExpiry" TEXT,
    "lastMaintenanceDate" TEXT,
    "nextMaintenanceDate" TEXT,
    "maintenanceNotes" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "purchasedBy" TEXT NOT NULL DEFAULT '',
    "stockQuantity" TEXT NOT NULL DEFAULT '',
    "estimatedEndDate" TEXT,
    "monthlyFrequency" DOUBLE PRECISION,
    "shelfLifeDays" INTEGER,
    "fromGrocery" BOOLEAN NOT NULL DEFAULT false,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "brand" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "model" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "purchaseDate" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "warrantyExpiry" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "lastMaintenanceDate" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "nextMaintenanceDate" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "maintenanceNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "purchasedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "stockQuantity" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "estimatedEndDate" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "monthlyFrequency" DOUBLE PRECISION;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "shelfLifeDays" INTEGER;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "fromGrocery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'dinner',
    "ingredients" TEXT NOT NULL DEFAULT '[]',
    "prepTimeMinutes" INTEGER,
    "cookTimeMinutes" INTEGER,
    "servings" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'dinner';
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "ingredients" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "prepTimeMinutes" INTEGER;
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "cookTimeMinutes" INTEGER;
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "servings" INTEGER;
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "breakfastId" TEXT,
    "lunchId" TEXT,
    "dinnerId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "cookedSlots" TEXT NOT NULL DEFAULT '[]',
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- Repair: add any column an older copy of the table lacks
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "breakfastId" TEXT;
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "lunchId" TEXT;
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "dinnerId" TEXT;
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "cookedSlots" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "MealPlanEntry" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MealPlanEntry_date_householdId_key" ON "MealPlanEntry"("date", "householdId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Bill" ADD CONSTRAINT "Bill_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Chore" ADD CONSTRAINT "Chore_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ChoreCompletion" ADD CONSTRAINT "ChoreCompletion_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Meal" ADD CONSTRAINT "Meal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_breakfastId_fkey" FOREIGN KEY ("breakfastId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_lunchId_fkey" FOREIGN KEY ("lunchId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

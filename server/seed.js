const { RECIPES } = require('./data/recipeKnowledge');

// Seed the default Indian recipes into the meal library for a household.
// Skips any recipe whose name already exists for that household.
async function seedRecipes(prisma, householdId) {
  const existing = await prisma.meal.findMany({
    where: { householdId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map(m => m.name.toLowerCase()));

  const toCreate = RECIPES.filter(r => !existingNames.has(r.name.toLowerCase()));
  if (!toCreate.length) return;

  await prisma.meal.createMany({
    data: toCreate.map(r => ({
      name: r.name,
      type: r.type,
      ingredients: JSON.stringify(r.ingredients),
      prepTimeMinutes: r.prepTimeMinutes ?? null,
      cookTimeMinutes: r.cookTimeMinutes ?? null,
      servings: r.servings ?? null,
      notes: '',
      householdId,
    })),
  });

  console.log(`  Seeded ${toCreate.length} default recipe(s) for household ${householdId}`);
}

module.exports = { seedRecipes };

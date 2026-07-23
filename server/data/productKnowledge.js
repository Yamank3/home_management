// Product knowledge base: maps common grocery item names to auto-fill metadata.
// Keys are lowercase. Lookup does fuzzy prefix/substring matching.

const PRODUCTS = [
  // --- Produce ---
  { keywords: ['apple','apples'],           category:'produce',       quantity:'1 kg',    monthlyFrequency:8,  shelfLifeDays:30  },
  { keywords: ['banana','bananas'],          category:'produce',       quantity:'1 bunch', monthlyFrequency:8,  shelfLifeDays:7   },
  { keywords: ['orange','oranges'],          category:'produce',       quantity:'1 kg',    monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['lemon','lemons'],            category:'produce',       quantity:'4 pcs',   monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['lime','limes'],              category:'produce',       quantity:'4 pcs',   monthlyFrequency:2,  shelfLifeDays:21  },
  { keywords: ['strawberr'],                 category:'produce',       quantity:'250g',     monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['blueberr'],                  category:'produce',       quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:5   },
  { keywords: ['grape','grapes'],            category:'produce',       quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:7   },
  { keywords: ['watermelon'],                category:'produce',       quantity:'1 whole', monthlyFrequency:2,  shelfLifeDays:7   },
  { keywords: ['mango','mangoes'],           category:'produce',       quantity:'2 pcs',   monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['avocado'],                   category:'produce',       quantity:'2 pcs',   monthlyFrequency:4,  shelfLifeDays:4   },
  { keywords: ['tomato','tomatoes'],         category:'produce',       quantity:'500g',     monthlyFrequency:8,  shelfLifeDays:7   },
  { keywords: ['onion','onions'],            category:'produce',       quantity:'1 kg',    monthlyFrequency:4,  shelfLifeDays:30  },
  { keywords: ['garlic'],                    category:'produce',       quantity:'1 bulb',  monthlyFrequency:4,  shelfLifeDays:30  },
  { keywords: ['ginger'],                    category:'produce',       quantity:'100g',     monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['carrot','carrots'],          category:'produce',       quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['potato','potatoes'],         category:'produce',       quantity:'1 kg',    monthlyFrequency:4,  shelfLifeDays:30  },
  { keywords: ['sweet potato'],              category:'produce',       quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:21  },
  { keywords: ['broccoli'],                  category:'produce',       quantity:'1 head',  monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['cauliflower'],               category:'produce',       quantity:'1 head',  monthlyFrequency:2,  shelfLifeDays:5   },
  { keywords: ['spinach'],                   category:'produce',       quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:4   },
  { keywords: ['lettuce'],                   category:'produce',       quantity:'1 head',  monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['cucumber','cucumbers'],      category:'produce',       quantity:'2 pcs',   monthlyFrequency:4,  shelfLifeDays:7   },
  { keywords: ['bell pepper','capsicum'],    category:'produce',       quantity:'3 pcs',   monthlyFrequency:4,  shelfLifeDays:7   },
  { keywords: ['zucchini','courgette'],      category:'produce',       quantity:'2 pcs',   monthlyFrequency:2,  shelfLifeDays:7   },
  { keywords: ['mushroom','mushrooms'],      category:'produce',       quantity:'250g',     monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['celery'],                    category:'produce',       quantity:'1 bunch', monthlyFrequency:2,  shelfLifeDays:14  },
  { keywords: ['corn','sweetcorn'],          category:'produce',       quantity:'2 cobs',  monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['peas'],                      category:'produce',       quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['kale'],                      category:'produce',       quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:5   },
  { keywords: ['cabbage'],                   category:'produce',       quantity:'1 head',  monthlyFrequency:2,  shelfLifeDays:14  },
  { keywords: ['eggplant','aubergine'],      category:'produce',       quantity:'1 pc',    monthlyFrequency:2,  shelfLifeDays:7   },
  { keywords: ['leek','leeks'],              category:'produce',       quantity:'2 pcs',   monthlyFrequency:2,  shelfLifeDays:7   },
  { keywords: ['asparagus'],                 category:'produce',       quantity:'1 bunch', monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['fresh herb','parsley','coriander','cilantro','basil','mint','thyme','rosemary'], category:'produce', quantity:'1 bunch', monthlyFrequency:4, shelfLifeDays:7 },

  // --- Dairy & Eggs ---
  { keywords: ['milk'],                      category:'dairy',         quantity:'2 L',     monthlyFrequency:8,  shelfLifeDays:7   },
  { keywords: ['oat milk'],                  category:'dairy',         quantity:'1 L',     monthlyFrequency:4,  shelfLifeDays:10  },
  { keywords: ['almond milk'],               category:'dairy',         quantity:'1 L',     monthlyFrequency:4,  shelfLifeDays:10  },
  { keywords: ['soy milk'],                  category:'dairy',         quantity:'1 L',     monthlyFrequency:4,  shelfLifeDays:10  },
  { keywords: ['egg','eggs'],                category:'dairy',         quantity:'12 pcs',  monthlyFrequency:8,  shelfLifeDays:28  },
  { keywords: ['butter'],                    category:'dairy',         quantity:'250g',     monthlyFrequency:4,  shelfLifeDays:30  },
  { keywords: ['cheese'],                    category:'dairy',         quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['cheddar'],                   category:'dairy',         quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:21  },
  { keywords: ['mozzarella'],                category:'dairy',         quantity:'125g',     monthlyFrequency:4,  shelfLifeDays:7   },
  { keywords: ['parmesan'],                  category:'dairy',         quantity:'100g',     monthlyFrequency:2,  shelfLifeDays:30  },
  { keywords: ['cream cheese'],              category:'dairy',         quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:14  },
  { keywords: ['sour cream'],                category:'dairy',         quantity:'200ml',    monthlyFrequency:2,  shelfLifeDays:14  },
  { keywords: ['yoghurt','yogurt'],          category:'dairy',         quantity:'500g',     monthlyFrequency:8,  shelfLifeDays:14  },
  { keywords: ['greek yogurt','greek yoghurt'], category:'dairy',      quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:14  },
  { keywords: ['cream','double cream','single cream','heavy cream'], category:'dairy', quantity:'300ml', monthlyFrequency:4, shelfLifeDays:10 },
  { keywords: ['whipping cream'],            category:'dairy',         quantity:'300ml',    monthlyFrequency:2,  shelfLifeDays:10  },
  { keywords: ['cottage cheese'],            category:'dairy',         quantity:'250g',     monthlyFrequency:2,  shelfLifeDays:7   },
  { keywords: ['ice cream'],                 category:'frozen',        quantity:'500ml',    monthlyFrequency:2,  shelfLifeDays:90  },

  // --- Meat & Poultry ---
  { keywords: ['chicken breast'],            category:'meat',          quantity:'500g',     monthlyFrequency:8,  shelfLifeDays:3   },
  { keywords: ['chicken thigh','chicken leg'], category:'meat',        quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:3   },
  { keywords: ['whole chicken'],             category:'meat',          quantity:'1 whole', monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['minced beef','ground beef'], category:'meat',          quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:2   },
  { keywords: ['beef steak','steak'],        category:'meat',          quantity:'300g',     monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['beef mince'],                category:'meat',          quantity:'500g',     monthlyFrequency:4,  shelfLifeDays:2   },
  { keywords: ['lamb'],                      category:'meat',          quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['pork chop','pork chops'],    category:'meat',          quantity:'400g',     monthlyFrequency:2,  shelfLifeDays:3   },
  { keywords: ['bacon'],                     category:'meat',          quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:7   },
  { keywords: ['sausage','sausages'],        category:'meat',          quantity:'400g',     monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['ham'],                       category:'deli',          quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['turkey'],                    category:'meat',          quantity:'500g',     monthlyFrequency:1,  shelfLifeDays:3   },

  // --- Seafood ---
  { keywords: ['salmon'],                    category:'seafood',       quantity:'300g',     monthlyFrequency:4,  shelfLifeDays:2   },
  { keywords: ['tuna steak'],                category:'seafood',       quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:2   },
  { keywords: ['cod'],                       category:'seafood',       quantity:'300g',     monthlyFrequency:2,  shelfLifeDays:2   },
  { keywords: ['prawn','prawns','shrimp'],   category:'seafood',       quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:2   },
  { keywords: ['fish finger','fish fingers'], category:'frozen',       quantity:'300g',     monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['canned tuna','tinned tuna'], category:'canned-goods',  quantity:'2 cans',  monthlyFrequency:4,  shelfLifeDays:730 },
  { keywords: ['canned salmon'],             category:'canned-goods',  quantity:'1 can',   monthlyFrequency:2,  shelfLifeDays:730 },

  // --- Bakery ---
  { keywords: ['bread','white bread','brown bread','wholemeal bread'], category:'bakery', quantity:'1 loaf', monthlyFrequency:8, shelfLifeDays:5 },
  { keywords: ['sourdough'],                 category:'bakery',        quantity:'1 loaf', monthlyFrequency:4,  shelfLifeDays:5   },
  { keywords: ['baguette'],                  category:'bakery',        quantity:'1 pc',   monthlyFrequency:4,  shelfLifeDays:2   },
  { keywords: ['pita','pitta'],              category:'bakery',        quantity:'6 pcs',  monthlyFrequency:2,  shelfLifeDays:5   },
  { keywords: ['tortilla','tortillas','wrap','wraps'], category:'bakery', quantity:'8 pcs', monthlyFrequency:4, shelfLifeDays:7  },
  { keywords: ['roll','rolls','bun','buns'], category:'bakery',        quantity:'6 pcs',  monthlyFrequency:4,  shelfLifeDays:3   },
  { keywords: ['croissant'],                 category:'bakery',        quantity:'4 pcs',  monthlyFrequency:2,  shelfLifeDays:2   },
  { keywords: ['bagel','bagels'],            category:'bakery',        quantity:'4 pcs',  monthlyFrequency:2,  shelfLifeDays:5   },

  // --- Pasta & Grains ---
  { keywords: ['pasta','spaghetti','penne','fusilli','rigatoni','fettuccine'], category:'pasta-grains', quantity:'500g', monthlyFrequency:4, shelfLifeDays:730 },
  { keywords: ['rice','white rice','brown rice','basmati','jasmine rice'], category:'pasta-grains', quantity:'1 kg', monthlyFrequency:4, shelfLifeDays:730 },
  { keywords: ['noodle','noodles','ramen','udon','soba'], category:'pasta-grains', quantity:'250g', monthlyFrequency:4, shelfLifeDays:365 },
  { keywords: ['oat','oats','porridge','rolled oats'], category:'pasta-grains', quantity:'500g', monthlyFrequency:4, shelfLifeDays:365 },
  { keywords: ['flour','plain flour','self-raising flour','bread flour'], category:'pantry', quantity:'1 kg', monthlyFrequency:2, shelfLifeDays:365 },
  { keywords: ['quinoa'],                    category:'pasta-grains',  quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['couscous'],                  category:'pasta-grains',  quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['lentil','lentils'],          category:'canned-goods',  quantity:'400g',     monthlyFrequency:2,  shelfLifeDays:730 },

  // --- Canned Goods ---
  { keywords: ['canned tomato','chopped tomato','tinned tomato'], category:'canned-goods', quantity:'2 cans', monthlyFrequency:8, shelfLifeDays:730 },
  { keywords: ['tomato paste','tomato puree'], category:'canned-goods', quantity:'1 can', monthlyFrequency:4, shelfLifeDays:730  },
  { keywords: ['baked bean','baked beans'],  category:'canned-goods',  quantity:'2 cans',  monthlyFrequency:4,  shelfLifeDays:730 },
  { keywords: ['chickpea','chickpeas'],      category:'canned-goods',  quantity:'2 cans',  monthlyFrequency:4,  shelfLifeDays:730 },
  { keywords: ['kidney bean','kidney beans'], category:'canned-goods', quantity:'1 can',   monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['coconut milk'],              category:'canned-goods',  quantity:'400ml can', monthlyFrequency:4, shelfLifeDays:730 },
  { keywords: ['corn can','canned corn','sweetcorn can'], category:'canned-goods', quantity:'1 can', monthlyFrequency:4, shelfLifeDays:730 },
  { keywords: ['soup','canned soup'],        category:'canned-goods',  quantity:'2 cans',  monthlyFrequency:4,  shelfLifeDays:730 },

  // --- Pantry & Spices ---
  { keywords: ['olive oil'],                 category:'pantry',        quantity:'500ml',    monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['vegetable oil','sunflower oil'], category:'pantry',    quantity:'1 L',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['salt'],                      category:'pantry',        quantity:'1 kg',     monthlyFrequency:1,  shelfLifeDays:1825 },
  { keywords: ['black pepper','pepper'],     category:'pantry',        quantity:'50g',      monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['sugar','white sugar','caster sugar'], category:'pantry', quantity:'1 kg', monthlyFrequency:2, shelfLifeDays:730  },
  { keywords: ['brown sugar'],               category:'pantry',        quantity:'500g',     monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['honey'],                     category:'pantry',        quantity:'340g',     monthlyFrequency:1,  shelfLifeDays:1825 },
  { keywords: ['soy sauce'],                 category:'pantry',        quantity:'150ml',    monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['vinegar','white vinegar','apple cider vinegar','balsamic'], category:'pantry', quantity:'500ml', monthlyFrequency:1, shelfLifeDays:1825 },
  { keywords: ['ketchup','tomato ketchup'],  category:'pantry',        quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['mustard'],                   category:'pantry',        quantity:'200g',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['mayonnaise'],                category:'pantry',        quantity:'400g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['hot sauce','sriracha'],      category:'pantry',        quantity:'250ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['stock','chicken stock','beef stock','vegetable stock'], category:'pantry', quantity:'1 L', monthlyFrequency:4, shelfLifeDays:365 },
  { keywords: ['peanut butter'],             category:'pantry',        quantity:'340g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['jam','strawberry jam','marmalade'], category:'pantry', quantity:'340g',    monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['nutella','chocolate spread'], category:'pantry',       quantity:'400g',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['cumin'],                     category:'pantry',        quantity:'50g',      monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['paprika'],                   category:'pantry',        quantity:'50g',      monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['turmeric'],                  category:'pantry',        quantity:'50g',      monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['cinnamon'],                  category:'pantry',        quantity:'50g',      monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['baking soda','bicarbonate'], category:'pantry',        quantity:'200g',     monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['baking powder'],             category:'pantry',        quantity:'100g',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['yeast'],                     category:'pantry',        quantity:'7g sachet', monthlyFrequency:1, shelfLifeDays:365 },
  { keywords: ['cocoa powder'],              category:'pantry',        quantity:'200g',     monthlyFrequency:1,  shelfLifeDays:730 },

  // --- Frozen ---
  { keywords: ['frozen pea','frozen peas'],  category:'frozen',        quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['frozen vegetable'],          category:'frozen',        quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['frozen pizza'],              category:'frozen',        quantity:'1 pc',    monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['frozen chips','frozen fries'], category:'frozen',      quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['frozen berries'],            category:'frozen',        quantity:'500g',     monthlyFrequency:2,  shelfLifeDays:365 },

  // --- Beverages ---
  { keywords: ['water','mineral water','sparkling water'], category:'beverages', quantity:'6×500ml', monthlyFrequency:8, shelfLifeDays:365 },
  { keywords: ['orange juice','apple juice','juice'], category:'beverages', quantity:'1 L', monthlyFrequency:4, shelfLifeDays:7  },
  { keywords: ['coffee','instant coffee','ground coffee'], category:'beverages', quantity:'200g', monthlyFrequency:2, shelfLifeDays:365 },
  { keywords: ['tea','green tea','herbal tea','black tea'], category:'beverages', quantity:'40 bags', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['cola','coke','pepsi'],       category:'beverages',     quantity:'6 cans',  monthlyFrequency:4,  shelfLifeDays:270 },
  { keywords: ['energy drink','red bull'],   category:'beverages',     quantity:'4 cans',  monthlyFrequency:2,  shelfLifeDays:270 },
  { keywords: ['protein shake','protein powder'], category:'health-foods', quantity:'1 kg', monthlyFrequency:2, shelfLifeDays:365 },

  // --- Alcohol ---
  { keywords: ['wine','red wine','white wine'], category:'alcohol',    quantity:'1 bottle', monthlyFrequency:4, shelfLifeDays:730 },
  { keywords: ['beer','lager','ale'],        category:'alcohol',       quantity:'6 pack',  monthlyFrequency:4,  shelfLifeDays:180 },

  // --- Snacks ---
  { keywords: ['crisp','crisps','chip','chips','pringles'], category:'snacks', quantity:'150g', monthlyFrequency:4, shelfLifeDays:90 },
  { keywords: ['biscuit','biscuits','cookie','cookies'], category:'snacks', quantity:'200g', monthlyFrequency:4, shelfLifeDays:90  },
  { keywords: ['cracker','crackers','rice cake'], category:'snacks',   quantity:'200g',     monthlyFrequency:4,  shelfLifeDays:90  },
  { keywords: ['nut','nuts','almond','almonds','cashew','walnut'], category:'snacks', quantity:'200g', monthlyFrequency:2, shelfLifeDays:180 },
  { keywords: ['popcorn'],                   category:'snacks',        quantity:'100g',     monthlyFrequency:2,  shelfLifeDays:90  },
  { keywords: ['granola bar','energy bar','protein bar'], category:'snacks', quantity:'6 bars', monthlyFrequency:4, shelfLifeDays:180 },
  { keywords: ['dried fruit','raisin','raisins'], category:'snacks',   quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:180 },

  // --- Sweets ---
  { keywords: ['chocolate','dark chocolate','milk chocolate'], category:'sweets', quantity:'100g', monthlyFrequency:4, shelfLifeDays:180 },
  { keywords: ['candy','sweets','gummy'],    category:'sweets',        quantity:'150g',     monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['cake'],                      category:'sweets',        quantity:'1 pc',    monthlyFrequency:2,  shelfLifeDays:3   },

  // --- Health Foods ---
  { keywords: ['chia seed','chia seeds'],    category:'health-foods',  quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['flaxseed','flax seed'],      category:'health-foods',  quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['hemp seed'],                 category:'health-foods',  quantity:'200g',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['protein powder'],            category:'health-foods',  quantity:'1 kg',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['multivitamin','vitamin c','vitamin d','vitamin b'], category:'vitamins', quantity:'30 tabs', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['omega 3','fish oil'],        category:'vitamins',      quantity:'60 caps',  monthlyFrequency:1,  shelfLifeDays:730 },

  // --- Cleaning ---
  { keywords: ['washing up liquid','dish soap','dish liquid'], category:'cleaning', quantity:'500ml', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['dishwasher tablet','dishwasher pod'], category:'cleaning', quantity:'30 tabs', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['surface spray','kitchen spray','all purpose cleaner'], category:'cleaning', quantity:'500ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['bleach'],                    category:'cleaning',      quantity:'750ml',    monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['bin bag','bin liner','trash bag'], category:'cleaning', quantity:'30 bags', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['sponge','scrubber'],         category:'cleaning',      quantity:'2 pcs',   monthlyFrequency:2,  shelfLifeDays:30  },
  { keywords: ['kitchen roll','paper towel'], category:'cleaning',     quantity:'4 rolls', monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['toilet cleaner','toilet duck'], category:'cleaning',   quantity:'750ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['floor cleaner','mop refill'], category:'cleaning',     quantity:'1 bottle', monthlyFrequency:1, shelfLifeDays:730 },

  // --- Laundry ---
  { keywords: ['laundry detergent','washing powder','washing liquid'], category:'laundry', quantity:'1.5 kg', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['laundry pod','washing capsule'], category:'laundry',   quantity:'30 pods', monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['fabric softener','conditioner'], category:'laundry',   quantity:'1 L',     monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['stain remover'],             category:'laundry',       quantity:'500ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['dryer sheet'],               category:'laundry',       quantity:'40 sheets', monthlyFrequency:1, shelfLifeDays:730 },

  // --- Personal Care ---
  { keywords: ['shampoo'],                   category:'personal-care', quantity:'400ml',    monthlyFrequency:1,  shelfLifeDays:1095 },
  { keywords: ['conditioner'],               category:'personal-care', quantity:'400ml',    monthlyFrequency:1,  shelfLifeDays:1095 },
  { keywords: ['body wash','shower gel'],    category:'personal-care', quantity:'400ml',    monthlyFrequency:2,  shelfLifeDays:1095 },
  { keywords: ['soap','hand soap','bar soap'], category:'personal-care', quantity:'3 bars', monthlyFrequency:1, shelfLifeDays:1095 },
  { keywords: ['toothpaste'],                category:'personal-care', quantity:'100ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['toothbrush'],                category:'personal-care', quantity:'1 pc',    monthlyFrequency:0.3,shelfLifeDays:90  },
  { keywords: ['deodorant'],                 category:'personal-care', quantity:'150ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['razor','shaving cream'],     category:'personal-care', quantity:'1 pc',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['moisturiser','lotion','face cream'], category:'personal-care', quantity:'150ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['sunscreen','sun cream','spf'], category:'personal-care', quantity:'200ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['toilet paper','toilet roll','loo roll'], category:'personal-care', quantity:'12 rolls', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['tissue','tissues','facial tissue'], category:'personal-care', quantity:'1 box', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['sanitary pad','tampon','period'], category:'personal-care', quantity:'1 pack', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['cotton pad','cotton ball'], category:'personal-care',  quantity:'100 pcs', monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['nail clipper','nail file'],  category:'personal-care', quantity:'1 pc',    monthlyFrequency:0.2,shelfLifeDays:1825},
  { keywords: ['lip balm','chapstick'],      category:'personal-care', quantity:'1 pc',    monthlyFrequency:0.5,shelfLifeDays:730 },

  // --- Baby & Kids ---
  { keywords: ['nappy','nappies','diaper'],  category:'baby',          quantity:'1 pack',  monthlyFrequency:4,  shelfLifeDays:1095 },
  { keywords: ['baby wipe','baby wipes'],    category:'baby',          quantity:'2 packs', monthlyFrequency:4,  shelfLifeDays:730 },
  { keywords: ['baby food','baby formula','infant formula'], category:'baby', quantity:'1 pack', monthlyFrequency:4, shelfLifeDays:365 },
  { keywords: ['baby shampoo','baby wash'],  category:'baby',          quantity:'200ml',   monthlyFrequency:1,  shelfLifeDays:1095 },

  // --- Pet ---
  { keywords: ['dog food','cat food','pet food'], category:'pet',      quantity:'1 kg',    monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['cat litter','kitty litter'], category:'pet',           quantity:'5 kg',    monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['pet treat','dog treat','cat treat'], category:'pet',   quantity:'200g',    monthlyFrequency:2,  shelfLifeDays:180 },
];

// Lookup by name — returns best match or null
function lookupProduct(name) {
  const q = name.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  for (const product of PRODUCTS) {
    for (const keyword of product.keywords) {
      if (q === keyword) return product;           // exact match
      if (q.includes(keyword) || keyword.includes(q)) {
        const score = keyword.length;
        if (score > bestScore) { bestScore = score; bestMatch = product; }
      }
    }
  }
  return bestMatch;
}

module.exports = { lookupProduct };

// Indian recipe knowledge base
// Each recipe has ingredients with base quantities for 2 servings.
// Quantities are scaled by the household memberCount at lookup time.

const RECIPES = [

  // ─── BREAKFAST ──────────────────────────────────────────────────────────────

  {
    keywords: ['poha','aloo poha','batata poha'],
    name: 'Poha', type: 'breakfast', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 15,
    ingredients: [
      { name: 'Poha (flattened rice)', quantity: '200g' },
      { name: 'Potato (aloo)', quantity: '1 medium' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Mustard seeds (rai)', quantity: '1 tsp' },
      { name: 'Curry leaves (kadi patta)', quantity: '8-10 leaves' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Lemon (nimbu)', quantity: '1 pc' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['upma','suji upma','rava upma'],
    name: 'Upma', type: 'breakfast', servings: 2,
    prepTimeMinutes: 5, cookTimeMinutes: 15,
    ingredients: [
      { name: 'Semolina (sooji/rava)', quantity: '1 cup' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Ginger (adrak)', quantity: '½ inch' },
      { name: 'Mustard seeds (rai)', quantity: '1 tsp' },
      { name: 'Curry leaves (kadi patta)', quantity: '8 leaves' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['paratha','aloo paratha','stuffed paratha'],
    name: 'Aloo Paratha', type: 'breakfast', servings: 2,
    prepTimeMinutes: 20, cookTimeMinutes: 20,
    ingredients: [
      { name: 'Wheat flour (atta)', quantity: '200g' },
      { name: 'Potato (aloo)', quantity: '3 medium' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '½ tsp' },
      { name: 'Ghee', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['idli','soft idli'],
    name: 'Idli', type: 'breakfast', servings: 2,
    prepTimeMinutes: 480, cookTimeMinutes: 15,
    ingredients: [
      { name: 'Idli rice', quantity: '200g' },
      { name: 'Urad dal', quantity: '75g' },
      { name: 'Salt (namak)', quantity: 'to taste' },
      { name: 'Coconut chutney', quantity: 'as needed' },
      { name: 'Sambar', quantity: 'as needed' },
    ],
  },

  {
    keywords: ['dosa','masala dosa','plain dosa'],
    name: 'Dosa', type: 'breakfast', servings: 2,
    prepTimeMinutes: 480, cookTimeMinutes: 20,
    ingredients: [
      { name: 'Idli rice', quantity: '200g' },
      { name: 'Urad dal', quantity: '50g' },
      { name: 'Potato (aloo)', quantity: '3 medium' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Mustard seeds (rai)', quantity: '1 tsp' },
      { name: 'Curry leaves (kadi patta)', quantity: '8 leaves' },
      { name: 'Turmeric (haldi)', quantity: '¼ tsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['pav bhaji'],
    name: 'Pav Bhaji', type: 'breakfast', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Pav bun', quantity: '4 pcs' },
      { name: 'Potato (aloo)', quantity: '3 medium' },
      { name: 'Cauliflower (gobhi)', quantity: '1 cup' },
      { name: 'Capsicum (shimla mirch)', quantity: '1 medium' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Pav bhaji masala', quantity: '2 tbsp' },
      { name: 'Butter (makhan)', quantity: '3 tbsp' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Lemon (nimbu)', quantity: '1 pc' },
    ],
  },

  {
    keywords: ['omelette','egg omelette','anda omelette'],
    name: 'Egg Omelette', type: 'breakfast', servings: 2,
    prepTimeMinutes: 5, cookTimeMinutes: 10,
    ingredients: [
      { name: 'Eggs (anda)', quantity: '4 pcs' },
      { name: 'Onion (pyaaz)', quantity: '1 small' },
      { name: 'Green chilli (hari mirch)', quantity: '1 pc' },
      { name: 'Coriander (dhania)', quantity: '1 tbsp' },
      { name: 'Refined oil', quantity: '1 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  // ─── LUNCH / DINNER MAINS ───────────────────────────────────────────────────

  {
    keywords: ['dal tadka','dal fry','yellow dal','toor dal tadka'],
    name: 'Dal Tadka', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Toor dal (arhar dal)', quantity: '150g' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '4 cloves' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Ghee', quantity: '2 tbsp' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['dal makhani','black dal','maa ki dal'],
    name: 'Dal Makhani', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 60,
    ingredients: [
      { name: 'Black urad dal', quantity: '100g' },
      { name: 'Rajma (kidney beans)', quantity: '30g' },
      { name: 'Onion (pyaaz)', quantity: '1 large' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Butter (makhan)', quantity: '3 tbsp' },
      { name: 'Cream (malai)', quantity: '3 tbsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['rajma','rajma chawal','rajma rice'],
    name: 'Rajma Chawal', type: 'dinner', servings: 2,
    prepTimeMinutes: 480, cookTimeMinutes: 40,
    ingredients: [
      { name: 'Rajma (kidney beans)', quantity: '150g' },
      { name: 'Basmati rice', quantity: '200g' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Rajma masala', quantity: '2 tsp' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Ghee', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['chole','chole bhature','chana masala'],
    name: 'Chole Bhature', type: 'lunch', servings: 2,
    prepTimeMinutes: 480, cookTimeMinutes: 40,
    ingredients: [
      { name: 'Kabuli chana (white chickpeas)', quantity: '200g' },
      { name: 'Wheat flour (atta)', quantity: '200g' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Chana masala / Chole masala', quantity: '2 tsp' },
      { name: 'Refined oil', quantity: '4 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['palak paneer','spinach paneer'],
    name: 'Palak Paneer', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Spinach (palak)', quantity: '400g' },
      { name: 'Paneer', quantity: '200g' },
      { name: 'Onion (pyaaz)', quantity: '1 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '4 cloves' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Cream (malai)', quantity: '2 tbsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['paneer butter masala','paneer makhani','butter paneer'],
    name: 'Paneer Butter Masala', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Paneer', quantity: '250g' },
      { name: 'Tomato (tamatar)', quantity: '4 medium' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Butter (makhan)', quantity: '3 tbsp' },
      { name: 'Cream (malai)', quantity: '3 tbsp' },
      { name: 'Kashmiri red chilli powder', quantity: '1 tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '1 tsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['chicken curry','murg curry','chicken gravy'],
    name: 'Chicken Curry', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 40,
    ingredients: [
      { name: 'Chicken', quantity: '500g' },
      { name: 'Onion (pyaaz)', quantity: '2 large' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '6 cloves' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Curd (dahi)', quantity: '3 tbsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1½ tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['butter chicken','murgh makhani','dal bukhara'],
    name: 'Butter Chicken', type: 'dinner', servings: 2,
    prepTimeMinutes: 20, cookTimeMinutes: 40,
    ingredients: [
      { name: 'Chicken', quantity: '500g' },
      { name: 'Tomato (tamatar)', quantity: '4 large' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '2 inch' },
      { name: 'Garlic (lahsun)', quantity: '8 cloves' },
      { name: 'Butter (makhan)', quantity: '4 tbsp' },
      { name: 'Cream (malai)', quantity: '4 tbsp' },
      { name: 'Curd (dahi)', quantity: '3 tbsp' },
      { name: 'Kashmiri red chilli powder', quantity: '2 tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['biryani','chicken biryani','veg biryani','hyderabadi biryani','dum biryani'],
    name: 'Biryani', type: 'dinner', servings: 2,
    prepTimeMinutes: 30, cookTimeMinutes: 60,
    ingredients: [
      { name: 'Basmati rice', quantity: '200g' },
      { name: 'Chicken', quantity: '400g' },
      { name: 'Onion (pyaaz)', quantity: '3 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Curd (dahi)', quantity: '150ml' },
      { name: 'Ginger (adrak)', quantity: '2 inch' },
      { name: 'Garlic (lahsun)', quantity: '8 cloves' },
      { name: 'Mint (pudina)', quantity: '1 bunch' },
      { name: 'Coriander (dhania)', quantity: '1 bunch' },
      { name: 'Biryani masala', quantity: '2 tbsp' },
      { name: 'Saffron (kesar)', quantity: 'a pinch' },
      { name: 'Ghee', quantity: '3 tbsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['mutton curry','gosht curry','mutton gravy'],
    name: 'Mutton Curry', type: 'dinner', servings: 2,
    prepTimeMinutes: 20, cookTimeMinutes: 60,
    ingredients: [
      { name: 'Mutton (gosht)', quantity: '500g' },
      { name: 'Onion (pyaaz)', quantity: '3 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Curd (dahi)', quantity: '100ml' },
      { name: 'Ginger (adrak)', quantity: '2 inch' },
      { name: 'Garlic (lahsun)', quantity: '8 cloves' },
      { name: 'Green chilli (hari mirch)', quantity: '3 pcs' },
      { name: 'Red chilli powder (lal mirch)', quantity: '2 tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '2 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Garam masala', quantity: '1½ tsp' },
      { name: 'Refined oil', quantity: '4 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['fish curry','machli curry','fish masala'],
    name: 'Fish Curry', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Fish (rohu/pomfret)', quantity: '500g' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Mustard oil (sarson tel)', quantity: '3 tbsp' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['aloo matar','potato peas curry','aloo peas'],
    name: 'Aloo Matar', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Potato (aloo)', quantity: '3 medium' },
      { name: 'Peas (matar)', quantity: '150g' },
      { name: 'Onion (pyaaz)', quantity: '1 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '3 cloves' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['baingan bharta','brinjal bharta','smoky baingan'],
    name: 'Baingan Bharta', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Brinjal/eggplant (baingan)', quantity: '1 large' },
      { name: 'Onion (pyaaz)', quantity: '1 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '½ inch' },
      { name: 'Garlic (lahsun)', quantity: '3 cloves' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Coriander (dhania)', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['bhindi masala','okra masala','bhindi sabzi'],
    name: 'Bhindi Masala', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 20,
    ingredients: [
      { name: 'Okra (bhindi)', quantity: '300g' },
      { name: 'Onion (pyaaz)', quantity: '1 large' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '1 tsp' },
      { name: 'Amchur (dry mango powder)', quantity: '½ tsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['sambar','south indian sambar','vegetable sambar'],
    name: 'Sambar', type: 'lunch', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Toor dal (arhar dal)', quantity: '100g' },
      { name: 'Drumstick (sahjan)', quantity: '2 pcs' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Tamarind (imli)', quantity: '1 tbsp' },
      { name: 'Sambar powder', quantity: '2 tsp' },
      { name: 'Mustard seeds (rai)', quantity: '1 tsp' },
      { name: 'Curry leaves (kadi patta)', quantity: '10 leaves' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['khichdi','moong khichdi','dal khichdi'],
    name: 'Khichdi', type: 'dinner', servings: 2,
    prepTimeMinutes: 5, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Basmati rice', quantity: '100g' },
      { name: 'Moong dal', quantity: '75g' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Ginger (adrak)', quantity: '½ inch' },
      { name: 'Green chilli (hari mirch)', quantity: '1 pc' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Ghee', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['fried rice','egg fried rice','veg fried rice'],
    name: 'Fried Rice', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 20,
    ingredients: [
      { name: 'Basmati rice (cooked)', quantity: '2 cups' },
      { name: 'Eggs (anda)', quantity: '2 pcs' },
      { name: 'Carrot (gajar)', quantity: '1 medium' },
      { name: 'Capsicum (shimla mirch)', quantity: '1 medium' },
      { name: 'Spring onion (hara pyaaz)', quantity: '3 stalks' },
      { name: 'Garlic (lahsun)', quantity: '4 cloves' },
      { name: 'Soy sauce', quantity: '2 tbsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
      { name: 'Black pepper (kali mirch)', quantity: '½ tsp' },
    ],
  },

  {
    keywords: ['kadai paneer','karahi paneer'],
    name: 'Kadai Paneer', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Paneer', quantity: '250g' },
      { name: 'Capsicum (shimla mirch)', quantity: '2 medium' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '5 cloves' },
      { name: 'Coriander seeds (dhania)', quantity: '1 tsp' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['aloo gobi','potato cauliflower','aloo gobhi'],
    name: 'Aloo Gobi', type: 'dinner', servings: 2,
    prepTimeMinutes: 10, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Potato (aloo)', quantity: '2 medium' },
      { name: 'Cauliflower (gobhi)', quantity: '1 small head' },
      { name: 'Onion (pyaaz)', quantity: '1 medium' },
      { name: 'Tomato (tamatar)', quantity: '2 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '3 cloves' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Coriander powder (dhania powder)', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '3 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['matar paneer','paneer matar'],
    name: 'Matar Paneer', type: 'dinner', servings: 2,
    prepTimeMinutes: 15, cookTimeMinutes: 25,
    ingredients: [
      { name: 'Paneer', quantity: '200g' },
      { name: 'Peas (matar)', quantity: '150g' },
      { name: 'Onion (pyaaz)', quantity: '2 medium' },
      { name: 'Tomato (tamatar)', quantity: '3 medium' },
      { name: 'Ginger (adrak)', quantity: '1 inch' },
      { name: 'Garlic (lahsun)', quantity: '4 cloves' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Turmeric (haldi)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '1 tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Refined oil', quantity: '2 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  // ─── BREADS ─────────────────────────────────────────────────────────────────

  {
    keywords: ['roti','chapati','phulka'],
    name: 'Roti / Chapati', type: 'dinner', servings: 2,
    prepTimeMinutes: 5, cookTimeMinutes: 15,
    ingredients: [
      { name: 'Wheat flour (atta)', quantity: '200g' },
      { name: 'Ghee', quantity: '1 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['naan','butter naan','garlic naan'],
    name: 'Garlic Naan', type: 'dinner', servings: 2,
    prepTimeMinutes: 90, cookTimeMinutes: 15,
    ingredients: [
      { name: 'Wheat flour (atta)', quantity: '200g' },
      { name: 'Maida (all purpose flour)', quantity: '100g' },
      { name: 'Curd (dahi)', quantity: '4 tbsp' },
      { name: 'Garlic (lahsun)', quantity: '6 cloves' },
      { name: 'Butter (makhan)', quantity: '2 tbsp' },
      { name: 'Coriander (dhania)', quantity: '1 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  // ─── SNACKS / SIDES ─────────────────────────────────────────────────────────

  {
    keywords: ['samosa','aloo samosa'],
    name: 'Samosa', type: 'snack', servings: 2,
    prepTimeMinutes: 30, cookTimeMinutes: 30,
    ingredients: [
      { name: 'Maida (all purpose flour)', quantity: '200g' },
      { name: 'Potato (aloo)', quantity: '4 medium' },
      { name: 'Peas (matar)', quantity: '75g' },
      { name: 'Ginger (adrak)', quantity: '½ inch' },
      { name: 'Green chilli (hari mirch)', quantity: '2 pcs' },
      { name: 'Cumin seeds (jeera)', quantity: '1 tsp' },
      { name: 'Amchur (dry mango powder)', quantity: '1 tsp' },
      { name: 'Garam masala', quantity: '½ tsp' },
      { name: 'Refined oil', quantity: 'for frying' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },

  {
    keywords: ['raita','boondi raita','vegetable raita'],
    name: 'Raita', type: 'snack', servings: 2,
    prepTimeMinutes: 5, cookTimeMinutes: 0,
    ingredients: [
      { name: 'Curd (dahi)', quantity: '300ml' },
      { name: 'Cucumber (kheera)', quantity: '1 medium' },
      { name: 'Cumin powder (jeera powder)', quantity: '½ tsp' },
      { name: 'Red chilli powder (lal mirch)', quantity: '¼ tsp' },
      { name: 'Coriander (dhania)', quantity: '1 tbsp' },
      { name: 'Salt (namak)', quantity: 'to taste' },
    ],
  },
];

// Find recipe by meal name — fuzzy keyword match
function lookupRecipe(name) {
  const q = name.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  for (const recipe of RECIPES) {
    for (const keyword of recipe.keywords) {
      if (q === keyword) return recipe;
      if (q.includes(keyword) || keyword.includes(q)) {
        const score = keyword.length;
        if (score > bestScore) { bestScore = score; bestMatch = recipe; }
      }
    }
  }
  return bestMatch;
}

// Scale ingredient quantities for a given number of servings
function scaleRecipe(recipe, targetServings) {
  if (!targetServings || targetServings === recipe.servings) return recipe;
  const factor = targetServings / recipe.servings;
  return {
    ...recipe,
    servings: targetServings,
    ingredients: recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: scaleQty(ing.quantity, factor),
    })),
  };
}

function scaleQty(qty, factor) {
  if (!qty || factor === 1) return qty;
  if (['to taste', 'as needed', 'for frying', 'a pinch'].includes(qty.toLowerCase())) return qty;
  const m = qty.match(/^([\d.½¼¾]+)\s*(.*)$/);
  if (!m) return qty;
  const num = parseFraction(m[1]);
  const unit = m[2].trim();
  const raw = num * factor;
  const rounded = Math.round(raw * 4) / 4;
  return `${formatFraction(rounded)} ${unit}`.trim();
}

function parseFraction(s) {
  if (s === '½') return 0.5;
  if (s === '¼') return 0.25;
  if (s === '¾') return 0.75;
  return parseFloat(s) || 1;
}

function formatFraction(n) {
  const frac = n % 1;
  const whole = Math.floor(n);
  if (frac === 0) return String(whole || 1);
  if (frac === 0.5) return whole ? `${whole}½` : '½';
  if (frac === 0.25) return whole ? `${whole}¼` : '¼';
  if (frac === 0.75) return whole ? `${whole}¾` : '¾';
  return String(Math.round(n * 10) / 10);
}

module.exports = { RECIPES, lookupRecipe, scaleRecipe };

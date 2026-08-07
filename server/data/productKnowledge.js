// Indian market product knowledge base
// Keywords include English names, Hindi names, and common transliterations
// Quantities use Indian market standards (kg, litre, packet, piece)

const PRODUCTS = [

  // ─── PRODUCE / SABZI ───────────────────────────────────────────────────────

  // Leafy vegetables
  { keywords: ['spinach','palak','paalak'],                    category:'produce', quantity:'1 bunch',   monthlyFrequency:8,  shelfLifeDays:7  },
  { keywords: ['fenugreek','methi'],                           category:'produce', quantity:'1 bunch',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['coriander','dhania','dhaniya','cilantro'],     category:'produce', quantity:'1 bunch',   monthlyFrequency:8,  shelfLifeDays:7  },
  { keywords: ['mint','pudina'],                               category:'produce', quantity:'1 bunch',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['curry leaves','kadi patta','kadhi patta'],     category:'produce', quantity:'1 bunch',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['mustard leaves','sarson','sarson ka saag'],    category:'produce', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['amaranth','chaulai'],                          category:'produce', quantity:'1 bunch',   monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['drumstick','moringa','sahjan','sehjan'],       category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['cabbage','bandh gobhi','band gobhi'],          category:'produce', quantity:'1 head',    monthlyFrequency:4,  shelfLifeDays:7  },

  // Gourds & squash
  { keywords: ['bottle gourd','lauki','ghiya','doodhi'],       category:'produce', quantity:'1 pc',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['bitter gourd','karela'],                       category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['ridge gourd','turai','torai'],                 category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['pointed gourd','parwal'],                      category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['ivy gourd','tindli','tindora','kundru'],        category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['ash gourd','petha','safed petha'],             category:'produce', quantity:'500g',      monthlyFrequency:1,  shelfLifeDays:14 },
  { keywords: ['pumpkin','kaddu'],                             category:'produce', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:14 },
  { keywords: ['snake gourd','chichinda'],                     category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },

  // Everyday vegetables
  { keywords: ['potato','aloo','aaloo'],                       category:'produce', quantity:'1 kg',      monthlyFrequency:8,  shelfLifeDays:30 },
  { keywords: ['onion','pyaaz','pyaz','kanda'],                category:'produce', quantity:'1 kg',      monthlyFrequency:8,  shelfLifeDays:30 },
  { keywords: ['tomato','tamatar'],                            category:'produce', quantity:'500g',      monthlyFrequency:8,  shelfLifeDays:7  },
  { keywords: ['green chilli','hari mirch','hara mircha'],     category:'produce', quantity:'100g',      monthlyFrequency:8,  shelfLifeDays:7  },
  { keywords: ['ginger','adrak'],                              category:'produce', quantity:'100g',      monthlyFrequency:8,  shelfLifeDays:14 },
  { keywords: ['garlic','lahsun','lasun'],                     category:'produce', quantity:'100g',      monthlyFrequency:8,  shelfLifeDays:30 },
  { keywords: ['cauliflower','gobhi','phool gobhi','fulkopir'], category:'produce', quantity:'1 head',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['brinjal','eggplant','baingan'],                category:'produce', quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['broccoli','hari gobhi'],                       category:'produce', quantity:'1 head',    monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['cucumber','kheera','kakdi'],                   category:'produce', quantity:'2 pcs',     monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['okra','bhindi','lady finger'],                 category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['capsicum','shimla mirch','bell pepper'],       category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:5  },
  { keywords: ['carrot','gajar'],                              category:'produce', quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:14 },
  { keywords: ['peas','matar','green peas'],                   category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['sweet potato','shakarkandi'],                  category:'produce', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:14 },
  { keywords: ['raw banana','kachcha kela','plantain'],        category:'produce', quantity:'4 pcs',     monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['raw papaya','kachcha papita'],                 category:'produce', quantity:'1 pc',      monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['yam','suran','jimikand'],                      category:'produce', quantity:'500g',      monthlyFrequency:1,  shelfLifeDays:14 },
  { keywords: ['colocasia','arbi','taro'],                     category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['radish','mooli'],                              category:'produce', quantity:'2 pcs',     monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['beetroot','chukandar'],                        category:'produce', quantity:'2 pcs',     monthlyFrequency:2,  shelfLifeDays:14 },
  { keywords: ['mushroom','mushrooms','khumb'],                category:'produce', quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['spring onion','hara pyaaz','green onion'],     category:'produce', quantity:'1 bunch',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['french beans','beans','fansi'],                category:'produce', quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['broad beans','sem','valor papdi'],             category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['lotus stem','kamal kakdi','bhein'],            category:'produce', quantity:'250g',      monthlyFrequency:1,  shelfLifeDays:5  },

  // Fruits
  { keywords: ['banana','kela'],                               category:'produce', quantity:'1 dozen',   monthlyFrequency:8,  shelfLifeDays:5  },
  { keywords: ['apple','seb'],                                 category:'produce', quantity:'1 kg',      monthlyFrequency:4,  shelfLifeDays:14 },
  { keywords: ['mango','aam'],                                 category:'produce', quantity:'1 kg',      monthlyFrequency:4,  shelfLifeDays:4  },
  { keywords: ['papaya','papita'],                             category:'produce', quantity:'1 pc',      monthlyFrequency:4,  shelfLifeDays:4  },
  { keywords: ['guava','amrood'],                              category:'produce', quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:5  },
  { keywords: ['pomegranate','anar'],                          category:'produce', quantity:'2 pcs',     monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['orange','santra','narangi'],                   category:'produce', quantity:'1 kg',      monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['grapes','angoor'],                             category:'produce', quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:5  },
  { keywords: ['watermelon','tarbuz'],                         category:'produce', quantity:'1 pc',      monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['muskmelon','kharbooja'],                       category:'produce', quantity:'1 pc',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['pineapple','ananas'],                          category:'produce', quantity:'1 pc',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['coconut','nariyal'],                           category:'produce', quantity:'1 pc',      monthlyFrequency:4,  shelfLifeDays:14 },
  { keywords: ['lemon','nimbu'],                               category:'produce', quantity:'6 pcs',     monthlyFrequency:8,  shelfLifeDays:14 },
  { keywords: ['mosambi','sweet lime'],                        category:'produce', quantity:'1 kg',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['chikoo','sapodilla','sapota'],                 category:'produce', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['litchi','lychee'],                             category:'produce', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['jamun','java plum'],                           category:'produce', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:2  },
  { keywords: ['custard apple','sitaphal','sharifa'],          category:'produce', quantity:'2 pcs',     monthlyFrequency:1,  shelfLifeDays:3  },
  { keywords: ['tamarind','imli'],                             category:'pantry',  quantity:'100g',      monthlyFrequency:2,  shelfLifeDays:180 },

  // ─── DAIRY / DUDH DAIRY ────────────────────────────────────────────────────

  { keywords: ['milk','dudh','doodh'],                         category:'dairy',   quantity:'1 litre',   monthlyFrequency:30, shelfLifeDays:2  },
  { keywords: ['curd','dahi','yogurt','yoghurt'],              category:'dairy',   quantity:'500g',      monthlyFrequency:12, shelfLifeDays:4  },
  { keywords: ['paneer','cottage cheese'],                     category:'dairy',   quantity:'200g',      monthlyFrequency:8,  shelfLifeDays:4  },
  { keywords: ['ghee','clarified butter'],                     category:'dairy',   quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['butter','makhan','makkhan'],                   category:'dairy',   quantity:'100g',      monthlyFrequency:4,  shelfLifeDays:30 },
  { keywords: ['cream','malai','fresh cream'],                 category:'dairy',   quantity:'200ml',     monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['khoya','mawa','khoa'],                         category:'dairy',   quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['lassi'],                                       category:'dairy',   quantity:'500ml',     monthlyFrequency:4,  shelfLifeDays:2  },
  { keywords: ['buttermilk','chaas','chach','mattha'],         category:'dairy',   quantity:'500ml',     monthlyFrequency:8,  shelfLifeDays:2  },
  { keywords: ['egg','anda','eggs'],                           category:'dairy',   quantity:'12 pcs',    monthlyFrequency:8,  shelfLifeDays:21 },
  { keywords: ['condensed milk','mithai ka doodh'],            category:'dairy',   quantity:'400g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['cheese','cheese slice'],                       category:'dairy',   quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:21 },

  // ─── MEAT & POULTRY / MAAS ─────────────────────────────────────────────────

  { keywords: ['chicken','murga','murgi'],                     category:'meat',    quantity:'500g',      monthlyFrequency:8,  shelfLifeDays:2  },
  { keywords: ['chicken breast','chicken tikka'],              category:'meat',    quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:2  },
  { keywords: ['chicken curry cut','kadai chicken'],           category:'meat',    quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:2  },
  { keywords: ['mutton','gosht','bakra','lamb'],               category:'meat',    quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:2  },
  { keywords: ['minced mutton','keema','kheema'],              category:'meat',    quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:2  },
  { keywords: ['fish','machli','machli'],                      category:'seafood', quantity:'500g',      monthlyFrequency:4,  shelfLifeDays:1  },
  { keywords: ['rohu','rohu fish'],                            category:'seafood', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:1  },
  { keywords: ['katla','catla'],                               category:'seafood', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:1  },
  { keywords: ['pomfret','paplet'],                            category:'seafood', quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:1  },
  { keywords: ['prawn','shrimp','jhinga','jheenga'],           category:'seafood', quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:1  },
  { keywords: ['hilsa','hilsa fish','ilish'],                  category:'seafood', quantity:'500g',      monthlyFrequency:1,  shelfLifeDays:1  },

  // ─── DALS & PULSES / DAL ────────────────────────────────────────────────────

  { keywords: ['toor dal','arhar dal','tuvar dal'],            category:'pasta-grains', quantity:'1 kg', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['moong dal','mung dal','green moong'],          category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['chana dal','Bengal gram','split chickpea'],    category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['masoor dal','red lentil','pink lentil'],       category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['urad dal','urad','black gram dal'],            category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['rajma','kidney beans','red kidney'],           category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['kabuli chana','white chana','chickpeas','chole'], category:'pasta-grains', quantity:'500g', monthlyFrequency:4, shelfLifeDays:365 },
  { keywords: ['black chana','kala chana','brown chickpea'],   category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['moth dal','matki','moth beans'],               category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['lobiya','black eyed peas','chawli'],           category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['val dal','field beans'],                       category:'pasta-grains', quantity:'500g', monthlyFrequency:1,  shelfLifeDays:365 },

  // ─── GRAINS & RICE / ANAAJ ──────────────────────────────────────────────────

  { keywords: ['basmati rice','basmati'],                      category:'pasta-grains', quantity:'5 kg', monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['rice','chawal','plain rice','sona masoori'],   category:'pasta-grains', quantity:'5 kg', monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['wheat flour','atta','gehun atta'],             category:'pasta-grains', quantity:'5 kg', monthlyFrequency:2,  shelfLifeDays:60  },
  { keywords: ['maida','all purpose flour','refined flour'],   category:'pasta-grains', quantity:'1 kg', monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['besan','gram flour','chickpea flour'],         category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:90  },
  { keywords: ['semolina','sooji','suji','rava'],              category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['poha','flattened rice','beaten rice'],         category:'pasta-grains', quantity:'500g', monthlyFrequency:4,  shelfLifeDays:180 },
  { keywords: ['murmura','puffed rice','muri'],                category:'snacks',  quantity:'200g',      monthlyFrequency:4,  shelfLifeDays:30  },
  { keywords: ['corn flour','makki ka atta','maize flour'],    category:'pasta-grains', quantity:'500g', monthlyFrequency:1,  shelfLifeDays:180 },
  { keywords: ['bajra','pearl millet','bajra atta'],           category:'pasta-grains', quantity:'1 kg', monthlyFrequency:2,  shelfLifeDays:90  },
  { keywords: ['jowar','sorghum','jowar atta'],                category:'pasta-grains', quantity:'1 kg', monthlyFrequency:2,  shelfLifeDays:90  },
  { keywords: ['ragi','finger millet','nachni'],               category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:90  },
  { keywords: ['oats','jaee'],                                 category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['vermicelli','seviyan','sevai'],                category:'pasta-grains', quantity:'200g', monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['pasta','macaroni'],                            category:'pasta-grains', quantity:'500g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['noodles','maggi','instant noodles'],           category:'snacks',  quantity:'4 packets', monthlyFrequency:4, shelfLifeDays:180 },
  { keywords: ['bread','pav','double roti'],                   category:'bakery',  quantity:'1 loaf',    monthlyFrequency:8,  shelfLifeDays:4  },
  { keywords: ['pav bun','pav'],                               category:'bakery',  quantity:'6 pcs',     monthlyFrequency:4,  shelfLifeDays:3  },
  { keywords: ['rusk','toast'],                                category:'bakery',  quantity:'1 packet',  monthlyFrequency:2,  shelfLifeDays:90  },

  // ─── SPICES / MASALA ────────────────────────────────────────────────────────

  { keywords: ['turmeric','haldi','turmeric powder'],          category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['red chilli powder','lal mirch','mirchi powder'], category:'pantry', quantity:'100g',     monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['cumin','jeera','zeera'],                       category:'pantry',  quantity:'100g',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['mustard seeds','rai','sarson'],                category:'pantry',  quantity:'100g',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['coriander powder','dhania powder','dhaniya powder'], category:'pantry', quantity:'100g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['garam masala'],                                category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['asafoetida','hing','heeng'],                   category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['black pepper','kali mirch'],                   category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['cardamom','elaichi','elachi'],                 category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['cloves','laung','lavang'],                     category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['cinnamon','dalchini'],                         category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['bay leaf','tej patta'],                        category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['dry mango powder','amchur','amchoor'],         category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['chaat masala'],                                category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['kitchen king masala','sabzi masala'],          category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['biryani masala'],                              category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['sambar masala','sambar powder'],               category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['rasam powder'],                                category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['pav bhaji masala'],                            category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['star anise','chakra phool'],                   category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['fenugreek seeds','methi dana','methi seeds'],  category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['fennel seeds','saunf'],                        category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['carom seeds','ajwain'],                        category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['nigella seeds','kalonji'],                     category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['poppy seeds','khus khus'],                     category:'pantry',  quantity:'50g',       monthlyFrequency:1,  shelfLifeDays:365 },

  // ─── PANTRY STAPLES ─────────────────────────────────────────────────────────

  { keywords: ['salt','namak'],                                category:'pantry',  quantity:'1 kg',      monthlyFrequency:1,  shelfLifeDays:1825 },
  { keywords: ['sugar','cheeni','chini','shakkar'],            category:'pantry',  quantity:'1 kg',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['jaggery','gur','gud'],                         category:'pantry',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['mustard oil','sarson ka tel'],                  category:'pantry', quantity:'1 litre',   monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['refined oil','sunflower oil','tel'],           category:'pantry',  quantity:'1 litre',   monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['coconut oil','nariyal tel'],                   category:'pantry',  quantity:'500ml',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['groundnut oil','peanut oil','moongphali tel'], category:'pantry',  quantity:'1 litre',   monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['vinegar','sirka'],                             category:'pantry',  quantity:'500ml',     monthlyFrequency:1,  shelfLifeDays:1825 },
  { keywords: ['honey','shahad','madhu'],                      category:'pantry',  quantity:'250g',      monthlyFrequency:1,  shelfLifeDays:1825 },
  { keywords: ['tomato ketchup','sauce','tomato sauce'],       category:'pantry',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['soy sauce','soya sauce'],                      category:'pantry',  quantity:'200ml',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['green chutney','mint chutney'],                category:'pantry',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['tamarind chutney','imli chutney'],             category:'pantry',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:14 },
  { keywords: ['pickle','achar','achaar'],                     category:'pantry',  quantity:'250g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['papad','poppadum'],                            category:'pantry',  quantity:'1 packet',  monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['baking soda','meetha soda','cooking soda'],   category:'pantry',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['rose water','gulab jal','rose essence'],       category:'pantry',  quantity:'100ml',     monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['desiccated coconut','coconut powder','nariyal burra'], category:'pantry', quantity:'200g', monthlyFrequency:1, shelfLifeDays:90 },
  { keywords: ['dry fruits','mixed dry fruits'],               category:'pantry',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:90 },
  { keywords: ['cashew','kaju'],                               category:'snacks',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:90 },
  { keywords: ['almond','badam'],                              category:'snacks',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['peanut','moongphali','groundnut'],             category:'snacks',  quantity:'250g',      monthlyFrequency:4,  shelfLifeDays:60 },
  { keywords: ['raisin','kishmish'],                           category:'snacks',  quantity:'100g',      monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['walnut','akhrot'],                             category:'snacks',  quantity:'100g',      monthlyFrequency:2,  shelfLifeDays:90 },
  { keywords: ['pistachio','pista'],                           category:'snacks',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:90 },
  { keywords: ['dates','khajoor'],                             category:'snacks',  quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:90 },

  // ─── CANNED & PACKAGED ──────────────────────────────────────────────────────

  { keywords: ['coconut milk','nariyal doodh'],                category:'canned-goods', quantity:'400ml', monthlyFrequency:2, shelfLifeDays:365 },
  { keywords: ['canned tomato','tinned tomato'],               category:'canned-goods', quantity:'400g',  monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['sweet corn can','corn can'],                   category:'canned-goods', quantity:'400g',  monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['ready to eat','rte','heat and eat'],           category:'canned-goods', quantity:'1 packet', monthlyFrequency:2, shelfLifeDays:365 },
  { keywords: ['rajma can','chole can'],                       category:'canned-goods', quantity:'400g',  monthlyFrequency:2, shelfLifeDays:730 },

  // ─── BEVERAGES / PEENA ──────────────────────────────────────────────────────

  { keywords: ['tea','chai','chaa'],                           category:'beverages', quantity:'250g',    monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['green tea','green chai'],                      category:'beverages', quantity:'25 bags', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['coffee','kaafi','kapi'],                       category:'beverages', quantity:'200g',    monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['filter coffee','south indian filter coffee'],  category:'beverages', quantity:'200g',    monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['bournvita','horlicks','complan','health drink'], category:'beverages', quantity:'500g',  monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['water bottle','mineral water','packaged water'], category:'beverages', quantity:'1 litre', monthlyFrequency:8, shelfLifeDays:365 },
  { keywords: ['nimbu paani','lime juice','lemon juice'],      category:'beverages', quantity:'500ml',   monthlyFrequency:4,  shelfLifeDays:7  },
  { keywords: ['mango juice','frooti','aamras'],               category:'beverages', quantity:'1 litre', monthlyFrequency:4,  shelfLifeDays:90 },
  { keywords: ['coconut water','nariyal paani'],               category:'beverages', quantity:'1 litre', monthlyFrequency:4,  shelfLifeDays:3  },
  { keywords: ['soft drink','cold drink','soda','cola','pepsi','thums up','sprite'], category:'beverages', quantity:'1.5 litre', monthlyFrequency:4, shelfLifeDays:180 },
  { keywords: ['sharbat','rose sharbat','rooh afza'],          category:'beverages', quantity:'750ml',   monthlyFrequency:2,  shelfLifeDays:365 },

  // ─── SNACKS / NAMKEEN ───────────────────────────────────────────────────────

  { keywords: ['namkeen','mixture','farsan'],                  category:'snacks',  quantity:'200g',      monthlyFrequency:4,  shelfLifeDays:60 },
  { keywords: ['bhujia','aloo bhujia','haldiram'],             category:'snacks',  quantity:'200g',      monthlyFrequency:4,  shelfLifeDays:60 },
  { keywords: ['chakli','chakri'],                             category:'snacks',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:30 },
  { keywords: ['chips','crisps','lays','bingo'],               category:'snacks',  quantity:'1 packet',  monthlyFrequency:4,  shelfLifeDays:60 },
  { keywords: ['biscuit','parle g','glucose biscuit'],         category:'snacks',  quantity:'1 packet',  monthlyFrequency:4,  shelfLifeDays:90 },
  { keywords: ['marie biscuit','digestive biscuit','cream biscuit'], category:'snacks', quantity:'1 packet', monthlyFrequency:2, shelfLifeDays:90 },
  { keywords: ['mathri','matthi'],                             category:'snacks',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:30 },
  { keywords: ['popcorn','corn pop'],                          category:'snacks',  quantity:'1 packet',  monthlyFrequency:2,  shelfLifeDays:60 },
  { keywords: ['roasted chana','chana jor garam'],             category:'snacks',  quantity:'200g',      monthlyFrequency:4,  shelfLifeDays:30 },

  // ─── SWEETS / MITHAI ────────────────────────────────────────────────────────

  { keywords: ['chocolate','dairy milk','5 star','kit kat'],   category:'sweets',  quantity:'1 pc',      monthlyFrequency:4,  shelfLifeDays:180 },
  { keywords: ['ladoo','laddoo'],                              category:'sweets',  quantity:'6 pcs',     monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['barfi','burfi','milk barfi'],                  category:'sweets',  quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:7  },
  { keywords: ['halwa','suji halwa'],                          category:'sweets',  quantity:'200g',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['gulab jamun'],                                 category:'sweets',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:3  },
  { keywords: ['rasgulla'],                                    category:'sweets',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:5  },
  { keywords: ['jalebi'],                                      category:'sweets',  quantity:'250g',      monthlyFrequency:2,  shelfLifeDays:2  },
  { keywords: ['sugar candy','mishri'],                        category:'sweets',  quantity:'100g',      monthlyFrequency:1,  shelfLifeDays:365 },

  // ─── FROZEN ─────────────────────────────────────────────────────────────────

  { keywords: ['frozen peas','frozen matar'],                  category:'frozen',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['frozen corn','frozen sweet corn'],             category:'frozen',  quantity:'500g',      monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['frozen paratha','frozen roti'],                category:'frozen',  quantity:'5 pcs',     monthlyFrequency:4,  shelfLifeDays:180 },
  { keywords: ['frozen samosa'],                               category:'frozen',  quantity:'10 pcs',    monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['ice cream','kulfi'],                           category:'frozen',  quantity:'500ml',     monthlyFrequency:2,  shelfLifeDays:90 },

  // ─── HEALTH FOODS ───────────────────────────────────────────────────────────

  { keywords: ['protein powder','whey protein'],               category:'health-foods', quantity:'1 kg', monthlyFrequency:1, shelfLifeDays:365 },
  { keywords: ['multivitamin','vitamin tablet'],               category:'vitamins', quantity:'30 tabs',  monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['chyawanprash'],                                category:'health-foods', quantity:'500g', monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['ashwagandha'],                                 category:'vitamins', quantity:'60 caps',  monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['triphala','haritaki'],                         category:'vitamins', quantity:'60 tabs',  monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['flaxseed','alsi','flax seeds'],                category:'health-foods', quantity:'250g', monthlyFrequency:2,  shelfLifeDays:180 },
  { keywords: ['chia seeds'],                                  category:'health-foods', quantity:'200g', monthlyFrequency:2,  shelfLifeDays:365 },
  { keywords: ['quinoa'],                                      category:'health-foods', quantity:'500g', monthlyFrequency:1,  shelfLifeDays:365 },

  // ─── CLEANING / SAFAI ───────────────────────────────────────────────────────

  { keywords: ['dishwash','vim','soap for utensils','bartan soap','bartan sabun'], category:'cleaning', quantity:'500g', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['dishwash bar','utensil cleaning bar'],         category:'cleaning', quantity:'1 bar',    monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['floor cleaner','phenyl','colin'],              category:'cleaning', quantity:'1 litre',  monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['toilet cleaner','harpic','toilex'],            category:'cleaning', quantity:'500ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['surface spray','kitchen cleaner','lizol'],     category:'cleaning', quantity:'500ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['bleach','sodium hypochlorite','safedi'],       category:'cleaning', quantity:'1 litre',  monthlyFrequency:1,  shelfLifeDays:365 },
  { keywords: ['garbage bag','dustbin bag','waste bag'],       category:'cleaning', quantity:'30 pcs',   monthlyFrequency:2,  shelfLifeDays:730 },
  { keywords: ['scrubber','scotch brite','steel wool'],        category:'cleaning', quantity:'2 pcs',    monthlyFrequency:2,  shelfLifeDays:30 },
  { keywords: ['mop','mop refill','pocha'],                    category:'cleaning', quantity:'1 pc',     monthlyFrequency:1,  shelfLifeDays:180 },

  // ─── LAUNDRY / DHULAI ───────────────────────────────────────────────────────

  { keywords: ['washing powder','surf','tide','rin','detergent'], category:'laundry', quantity:'1 kg',  monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['washing liquid','liquid detergent','ariel liquid'], category:'laundry', quantity:'1 litre', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['fabric softener','comfort','downy'],           category:'laundry', quantity:'500ml',    monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['stain remover','vanish'],                      category:'laundry', quantity:'250g',     monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['washing bar','washing soap','kapde ka sabun'], category:'laundry', quantity:'2 bars',   monthlyFrequency:2,  shelfLifeDays:730 },

  // ─── PERSONAL CARE / SAUNDARYA ──────────────────────────────────────────────

  { keywords: ['shampoo','kesh tel','baal dhona'],             category:'personal-care', quantity:'200ml', monthlyFrequency:1, shelfLifeDays:1095 },
  { keywords: ['conditioner','hair conditioner'],              category:'personal-care', quantity:'200ml', monthlyFrequency:1, shelfLifeDays:1095 },
  { keywords: ['soap','sabun','bathing soap','bar soap'],      category:'personal-care', quantity:'3 bars', monthlyFrequency:2, shelfLifeDays:1095 },
  { keywords: ['body wash','shower gel','shower cream'],       category:'personal-care', quantity:'200ml', monthlyFrequency:1, shelfLifeDays:1095 },
  { keywords: ['toothpaste','colgate','pepsodent'],            category:'personal-care', quantity:'200g',  monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['toothbrush','tooth brush'],                    category:'personal-care', quantity:'1 pc',  monthlyFrequency:0.3,shelfLifeDays:90 },
  { keywords: ['deodorant','deo','perfume spray'],             category:'personal-care', quantity:'150ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['face wash','muh dhona','facewash'],            category:'personal-care', quantity:'100ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['moisturiser','body lotion','cream','cold cream'], category:'personal-care', quantity:'100ml', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['coconut hair oil','hair oil','nariyal tel'],   category:'personal-care', quantity:'200ml', monthlyFrequency:1, shelfLifeDays:365 },
  { keywords: ['toilet paper','tissue roll'],                  category:'personal-care', quantity:'6 rolls', monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['tissue','tissue paper','facial tissue'],       category:'personal-care', quantity:'1 box',  monthlyFrequency:2, shelfLifeDays:730 },
  { keywords: ['sanitary pad','napkin','stayfree','whisper'],  category:'personal-care', quantity:'1 pack', monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['cotton','cotton roll','rooh'],                 category:'personal-care', quantity:'100g',   monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['razor','shaving blade','gillette'],            category:'personal-care', quantity:'1 pc',   monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['shaving cream','shaving gel'],                 category:'personal-care', quantity:'100g',   monthlyFrequency:1, shelfLifeDays:730 },
  { keywords: ['mehendi','henna','henna powder'],              category:'personal-care', quantity:'1 packet', monthlyFrequency:1, shelfLifeDays:365 },
  { keywords: ['kumkum','bindi','sindoor'],                    category:'personal-care', quantity:'1 pack', monthlyFrequency:1, shelfLifeDays:365 },

  // ─── BABY / BACCHA ──────────────────────────────────────────────────────────

  { keywords: ['diaper','nappy','pampers','huggies'],          category:'baby',    quantity:'1 pack',   monthlyFrequency:4,  shelfLifeDays:1095 },
  { keywords: ['baby wipes','wet wipes'],                      category:'baby',    quantity:'2 packs',  monthlyFrequency:4,  shelfLifeDays:730 },
  { keywords: ['baby food','cerelac','baby formula'],          category:'baby',    quantity:'1 pack',   monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['baby powder','johnson baby powder'],           category:'baby',    quantity:'100g',     monthlyFrequency:1,  shelfLifeDays:730 },
  { keywords: ['baby oil','johnson baby oil'],                 category:'baby',    quantity:'200ml',    monthlyFrequency:1,  shelfLifeDays:730 },

  // ─── PET / JANWAR ───────────────────────────────────────────────────────────

  { keywords: ['dog food','pet food','pedigree'],              category:'pet',     quantity:'1 kg',     monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['cat food','whiskas','meow'],                   category:'pet',     quantity:'1 kg',     monthlyFrequency:4,  shelfLifeDays:365 },
  { keywords: ['pet treat','dog treat','cat treat'],           category:'pet',     quantity:'200g',     monthlyFrequency:2,  shelfLifeDays:180 },
];

// Lookup by name — returns best match or null
function lookupProduct(name) {
  const q = name.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  for (const product of PRODUCTS) {
    for (const keyword of product.keywords) {
      if (q === keyword) return product;
      if (q.includes(keyword) || keyword.includes(q)) {
        const score = keyword.length;
        if (score > bestScore) { bestScore = score; bestMatch = product; }
      }
    }
  }
  return bestMatch;
}

// Scale the base quantity (written for 1 person) for a given household size.
// The base products are written for a single person / small family of ~2.
// We scale linearly but round to sensible units.
function scaleForHousehold(product, memberCount) {
  if (!memberCount || memberCount <= 1) return product;
  const factor = memberCount / 2; // base quantities assume ~2 people
  const scaled = scaleQuantityString(product.quantity, factor);
  const scaledFreq = product.monthlyFrequency != null
    ? Math.round(product.monthlyFrequency * (memberCount / 2) * 10) / 10
    : null;
  return { ...product, quantity: scaled, monthlyFrequency: scaledFreq };
}

// Parse a quantity string like "500g", "1 kg", "12 pcs", "1 litre", scale it, re-format.
function scaleQuantityString(qty, factor) {
  if (!qty || factor === 1) return qty;
  // Match: number + optional space + unit
  const m = qty.match(/^([\d.]+)\s*(.+)$/);
  if (!m) return qty;
  const num  = parseFloat(m[1]);
  const unit = m[2].trim();
  const raw  = num * factor;

  // Round to sensible precision based on unit
  const u = unit.toLowerCase();
  let rounded;
  if (u === 'kg' || u === 'litre' || u === 'l') {
    // Round to nearest 0.5 for weights/volumes
    rounded = Math.round(raw * 2) / 2;
    if (rounded >= 1) {
      rounded = Math.round(rounded * 10) / 10;
    }
  } else if (['g','ml','gm'].includes(u)) {
    // Round to nearest 50 for small units
    rounded = Math.round(raw / 50) * 50 || 50;
    // Upgrade g→kg, ml→litre if large enough
    if (u === 'g' && rounded >= 1000) return `${rounded / 1000} kg`;
    if (u === 'ml' && rounded >= 1000) return `${rounded / 1000} litre`;
  } else if (['pcs','pc','tabs','caps','bags','rolls','bars','pods','sheets','bunch','head','loaf','cobs','cans','bottles','pack','packs','dozen'].includes(u)) {
    rounded = Math.ceil(raw);
  } else {
    rounded = Math.round(raw * 10) / 10;
  }
  return `${rounded} ${unit}`;
}

module.exports = { lookupProduct, scaleForHousehold };

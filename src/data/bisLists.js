export const SPEC_OPTIONS_BY_CLASS = {
  Druid: [
    { key: "druid-balance-p6", label: "Balance (Phase 6)" },
    { key: "druid-feral-dps-p6", label: "Feral DPS (Phase 6)" },
    { key: "druid-feral-tank-p6", label: "Feral Tank (Phase 6)" },
    { key: "druid-resto-p6", label: "Restoration (Phase 6)" }
  ],
  Hunter: [
    { key: "hunter-dps-p6", label: "DPS (Phase 6)" }
  ],
  Mage: [
    { key: "mage-dps-p6", label: "DPS (Phase 6)" }
  ],
  Paladin: [
    { key: "paladin-retribution-p6", label: "DPS (Phase 6)" },
    { key: "paladin-holy-p6", label: "Holy (Phase 6)" }
  ],
  Priest: [
    { key: "priest-shadow-p6", label: "Shadow (Phase 6)" },
    { key: "priest-holy-p6", label: "Holy (Phase 6)" }
  ],
  Rogue: [
    { key: "rogue-swords-p6", label: "Combat Swords (Phase 6)" },
    { key: "rogue-daggers-p6", label: "Combat Daggers (Phase 6)" }
  ],
  Shaman: [
    { key: "shaman-elemental-p6", label: "Elemental (Phase 6)" },
    { key: "shaman-enhancement-p6", label: "Enhancement (Phase 6)" },
    { key: "shaman-resto-p6", label: "Restoration (Phase 6)" }
  ],
  Warlock: [
    { key: "warlock-dps-p6", label: "DPS (Phase 6)" }
  ],
  Warrior: [
    { key: "warrior-fury-p6", label: "Fury (Phase 6)" }
  ]
};

export const BIS_GUIDE_URL_BY_SPEC = {
  "druid-balance-p6": "https://www.wowhead.com/classic/guide/wow-classic-balance-druid-dps-naxxramas-best-in-slot-gear",
  "druid-feral-dps-p6": "https://www.wowhead.com/classic/guide/wow-classic-feral-druid-dps-naxxramas-best-in-slot-gear",
  "druid-feral-tank-p6": "https://www.wowhead.com/classic/guide/wow-classic-feral-druid-tank-naxxramas-best-in-slot-gear",
  "druid-resto-p6": "https://www.wowhead.com/classic/guide/wow-classic-druid-healing-naxxramas-best-in-slot-gear",
  "hunter-dps-p6": "https://www.wowhead.com/classic/guide/wow-classic-hunter-dps-naxxramas-best-in-slot-gear",
  "mage-dps-p6": "https://www.wowhead.com/classic/guide/wow-classic-mage-dps-naxxramas-best-in-slot-gear",
  "paladin-retribution-p6": "https://www.wowhead.com/classic/guide/wow-classic-paladin-dps-naxxramas-best-in-slot-gear",
  "paladin-holy-p6": "https://www.wowhead.com/classic/guide/wow-classic-paladin-healing-naxxramas-best-in-slot-gear",
  "priest-shadow-p6": "https://www.wowhead.com/classic/guide/wow-classic-shadow-priest-dps-naxxramas-best-in-slot-gear",
  "priest-holy-p6": "https://www.wowhead.com/classic/guide/wow-classic-priest-healing-naxxramas-best-in-slot-gear",
  "rogue-swords-p6": "https://www.wowhead.com/classic/guide/wow-classic-rogue-dps-naxxramas-best-in-slot-gear",
  "rogue-daggers-p6": "https://www.wowhead.com/classic/guide/wow-classic-rogue-dps-naxxramas-best-in-slot-gear",
  "shaman-elemental-p6": "https://www.wowhead.com/classic/guide/wow-classic-elemental-shaman-dps-naxxramas-best-in-slot-gear",
  "shaman-enhancement-p6": "https://www.wowhead.com/classic/guide/wow-classic-enhancement-shaman-dps-naxxramas-best-in-slot-gear",
  "shaman-resto-p6": "https://www.wowhead.com/classic/guide/wow-classic-shaman-healing-naxxramas-best-in-slot-gear",
  "warlock-dps-p6": "https://www.wowhead.com/classic/guide/wow-classic-warlock-dps-naxxramas-best-in-slot-gear",
  "warrior-fury-p6": "https://www.wowhead.com/classic/guide/wow-classic-fury-warrior-dps-naxxramas-best-in-slot-gear"
};

// Slot IDs follow WoW inventory slot numbering used by DataStore_Inventory.
export const BIS_ITEM_IDS_BY_SPEC = {
  "druid-balance-p6": {
    1: [
      { itemId: 19375, itemName: "Mish'undare, Circlet of the Mind Flayer" },
      { itemId: 23035, itemName: "Preceptor's Hat" },
      { itemId: 22267, itemName: "Spellweaver's Turban" },
      { itemId: 19886, itemName: "The Hexxer's Cover" }
    ],
    2: [
      { itemId: 23057, itemName: "Gem of Trapped Innocents" },
      { itemId: 21608, itemName: "Amulet of Vek'nilash" },
      { itemId: 18814, itemName: "Choker of the Fire Lord" },
      { itemId: 22943, itemName: "Malice Stone Pendant" },
      { itemId: 19613, itemName: "Pristine Enchanted South Seas Kelp" }
    ],
    3: [
      { itemId: 22983, itemName: "Rime Covered Mantle" },
      { itemId: 19370, itemName: "Mantle of the Blackwing Cabal" },
      { itemId: 20686, itemName: "Abyssal Cloth Amice" },
      { itemId: 10263, itemName: "Adventurer's Shoulders" }
    ],
    5: [
      { itemId: 21838, itemName: "Garb of Royal Ascension" },
      { itemId: 19682, itemName: "Bloodvine Vest" },
      { itemId: 23220, itemName: "Crystal Webbed Robe" },
      { itemId: 23085, itemName: "Robe of Undead Cleansing" },
      { itemId: 20635, itemName: "Jade Inlaid Vestments" }
    ],
    6: [
      { itemId: 22730, itemName: "Eyestalk Waist Cord" },
      { itemId: 19400, itemName: "Firemaw's Clutch" },
      { itemId: 19136, itemName: "Mana Igniting Cord" },
      { itemId: 22716, itemName: "Belt of Untapped Power" },
      { itemId: 19388, itemName: "Angelista's Grasp" }
    ],
    7: [
      { itemId: 19683, itemName: "Bloodvine Leggings" },
      { itemId: 23070, itemName: "Leggings of Polarity" },
      { itemId: 21461, itemName: "Leggings of the Black Blizzard" },
      { itemId: 19165, itemName: "Flarecore Leggings" }
    ],
    8: [
      { itemId: 19684, itemName: "Bloodvine Boots" },
      { itemId: 21600, itemName: "Boots of Epiphany" },
      { itemId: 20634, itemName: "Boots of Fright" },
      { itemId: 19131, itemName: "Snowblind Shoes" },
      { itemId: 19897, itemName: "Betrayer's Boots" }
    ],
    9: [
      { itemId: 21186, itemName: "Rockfury Bracers" },
      { itemId: 19374, itemName: "Bracers of Arcane Accuracy" },
      { itemId: 21611, itemName: "Burrower Bracers" },
      { itemId: 23021, itemName: "The Soul Harvester's Bindings" },
      { itemId: 23091, itemName: "Bracers of Undead Cleansing" }
    ],
    10: [
      { itemId: 21585, itemName: "Dark Storm Gauntlets" },
      { itemId: 23084, itemName: "Gloves of Undead Cleansing" },
      { itemId: 21689, itemName: "Gloves of Ebru" },
      { itemId: 19929, itemName: "Bloodtinged Gloves" },
      { itemId: 13258, itemName: "Slaghide Gauntlets" }
    ],
    11: [
      { itemId: 21709, itemName: "Ring of the Fallen God" },
      { itemId: 23031, itemName: "Band of the Inevitable" },
      { itemId: 23025, itemName: "Seal of the Damned" },
      { itemId: 19403, itemName: "Band of Forced Concentration" },
      { itemId: 21836, itemName: "Ritssyn's Ring of Chaos" }
    ],
    12: [
      { itemId: 21709, itemName: "Ring of the Fallen God" },
      { itemId: 23031, itemName: "Band of the Inevitable" },
      { itemId: 23025, itemName: "Seal of the Damned" },
      { itemId: 19403, itemName: "Band of Forced Concentration" },
      { itemId: 21836, itemName: "Ritssyn's Ring of Chaos" }
    ],
    13: [
      { itemId: 23207, itemName: "Mark of the Champion" },
      { itemId: 19379, itemName: "Neltharion's Tear" },
      { itemId: 23046, itemName: "The Restrained Essence of Sapphiron" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 19812, itemName: "Rune of the Dawn" },
      { itemId: 18820, itemName: "Talisman of Ephemeral Power" },
      { itemId: 12930, itemName: "Briarwood Reed" }
    ],
    14: [
      { itemId: 23207, itemName: "Mark of the Champion" },
      { itemId: 19379, itemName: "Neltharion's Tear" },
      { itemId: 23046, itemName: "The Restrained Essence of Sapphiron" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 19812, itemName: "Rune of the Dawn" },
      { itemId: 18820, itemName: "Talisman of Ephemeral Power" },
      { itemId: 12930, itemName: "Briarwood Reed" }
    ],
    15: [
      { itemId: 23050, itemName: "Cloak of the Necropolis" },
      { itemId: 22731, itemName: "Cloak of the Devoured" },
      { itemId: 19857, itemName: "Cloak of Consumption" },
      { itemId: 19378, itemName: "Cloak of the Brood Lord" },
      { itemId: 23017, itemName: "Veil of Eclipse" }
    ],
    16: [
      { itemId: 22800, itemName: "Brimstone Staff" },
      { itemId: 22799, itemName: "Soulseeker" },
      { itemId: 21273, itemName: "Blessed Qiraji Acolyte Staff" },
      { itemId: 19356, itemName: "Staff of the Shadow Flame" },
      { itemId: 22988, itemName: "The End of Dreams" },
      { itemId: 19360, itemName: "Lok'amir il Romathis" },
      { itemId: 22803, itemName: "Midnight Haze" },
      { itemId: 19347, itemName: "Claw of Chromaggus" }
    ],
    17: [
      { itemId: 23049, itemName: "Sapphiron's Left Eye" },
      { itemId: 21597, itemName: "Royal Scepter of Vek'lor" },
      { itemId: 19891, itemName: "Jin'do's Bag of Whammies" },
      { itemId: 22329, itemName: "Scepter of Interminable Focus" },
      { itemId: 21471, itemName: "Talon of Furious Concentration" }
    ]
  },
  "druid-feral-dps-p6": {
    1: [
      { itemId: 8345, itemName: "Wolfshead Helm" },
      { itemId: 21455, itemName: "Southwind Helm" }
    ],
    2: [
      { itemId: 19377, itemName: "Prestor's Talisman of Connivery" },
      { itemId: 23053, itemName: "Stormrage's Talisman of Seething" },
      { itemId: 21664, itemName: "Barbed Choker" },
      { itemId: 18404, itemName: "Onyxia Tooth Pendant" }
    ],
    3: [
      { itemId: 21665, itemName: "Mantle of Wicked Revenge" },
      { itemId: 21474, itemName: "Chitinous Shoulderguards" }
    ],
    5: [
      { itemId: 21680, itemName: "Vest of Swift Execution" },
      { itemId: 23226, itemName: "Ghoul Skin Tunic" }
    ],
    6: [
      { itemId: 21586, itemName: "Belt of Never-Ending Agony" },
      { itemId: 20216, itemName: "Belt of Preserved Heads" }
    ],
    7: [
      { itemId: 23071, itemName: "Leggings of Apocalypse" },
      { itemId: 16450, itemName: "Marshal's Dragonhide Legguards" },
      { itemId: 16552, itemName: "General's Dragonhide Leggings" },
      { itemId: 15062, itemName: "Devilsaur Leggings" }
    ],
    8: [
      { itemId: 21493, itemName: "Boots of the Vanguard" },
      { itemId: 19381, itemName: "Boots of the Shadow Flame" }
    ],
    9: [
      { itemId: 21602, itemName: "Qiraji Execution Bracers" },
      { itemId: 19146, itemName: "Wristguards of Stability" }
    ],
    10: [
      { itemId: 21672, itemName: "Gloves of Enforcement" },
      { itemId: 15063, itemName: "Devilsaur Gauntlets" }
    ],
    11: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19432, itemName: "Circle of Applied Force" }
    ],
    12: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19432, itemName: "Circle of Applied Force" }
    ],
    13: [
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 21670, itemName: "Badge of the Swarmguard" },
      { itemId: 21180, itemName: "Earthstrike" }
    ],
    14: [
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 21670, itemName: "Badge of the Swarmguard" },
      { itemId: 21180, itemName: "Earthstrike" }
    ],
    15: [
      { itemId: 21701, itemName: "Cloak of Concentrated Hatred" },
      { itemId: 21710, itemName: "Cloak of the Fallen God" },
      { itemId: 23045, itemName: "Shroud of Dominion" },
      { itemId: 18541, itemName: "Puissant Cape" }
    ],
    16: [
      { itemId: 9449, itemName: "Manual Crowd Pummeler" },
      { itemId: 22632, itemName: "Atiesh, Greatstaff of the Guardian" }
    ],
    18: [
      { itemId: 22397, itemName: "Idol of Ferocity" }
    ]
  },
  "druid-feral-tank-p6": {
    1: [
      { itemId: 16451, itemName: "Field Marshal's Dragonhide Helmet" },
      { itemId: 16550, itemName: "Warlord's Dragonhide Helmet" },
      { itemId: 8345, itemName: "Wolfshead Helm" },
      { itemId: 21455, itemName: "Southwind Helm" }
    ],
    2: [
      { itemId: 23053, itemName: "Stormrage's Talisman of Seething" },
      { itemId: 19377, itemName: "Prestor's Talisman of Connivery" },
      { itemId: 21664, itemName: "Barbed Choker" },
      { itemId: 18404, itemName: "Onyxia Tooth Pendant" }
    ],
    3: [
      { itemId: 21665, itemName: "Mantle of Wicked Revenge" },
      { itemId: 21474, itemName: "Chitinous Shoulderguards" }
    ],
    5: [
      { itemId: 23226, itemName: "Ghoul Skin Tunic" },
      { itemId: 21680, itemName: "Vest of Swift Execution" }
    ],
    6: [
      { itemId: 21586, itemName: "Belt of Never-Ending Agony" },
      { itemId: 20216, itemName: "Belt of Preserved Heads" }
    ],
    7: [
      { itemId: 23071, itemName: "Leggings of Apocalypse" },
      { itemId: 15062, itemName: "Devilsaur Leggings" }
    ],
    8: [
      { itemId: 21493, itemName: "Boots of the Vanguard" },
      { itemId: 19381, itemName: "Boots of the Shadow Flame" }
    ],
    9: [
      { itemId: 21602, itemName: "Qiraji Execution Bracers" },
      { itemId: 19146, itemName: "Wristguards of Stability" }
    ],
    10: [
      { itemId: 16448, itemName: "Marshal's Dragonhide Gauntlets" },
      { itemId: 16555, itemName: "General's Dragonhide Gloves" },
      { itemId: 21672, itemName: "Gloves of Enforcement" },
      { itemId: 21605, itemName: "Gloves of the Hidden Temple" },
      { itemId: 15063, itemName: "Devilsaur Gauntlets" }
    ],
    11: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19432, itemName: "Circle of Applied Force" }
    ],
    12: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19432, itemName: "Circle of Applied Force" }
    ],
    13: [
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 21180, itemName: "Earthstrike" }
    ],
    14: [
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 21180, itemName: "Earthstrike" }
    ],
    15: [
      { itemId: 21710, itemName: "Cloak of the Fallen God" },
      { itemId: 21701, itemName: "Cloak of Concentrated Hatred" },
      { itemId: 23045, itemName: "Shroud of Dominion" },
      { itemId: 18541, itemName: "Puissant Cape" }
    ],
    16: [
      { itemId: 9449, itemName: "Manual Crowd Pummeler" },
      { itemId: 22632, itemName: "Atiesh, Greatstaff of the Guardian" },
      { itemId: 21268, itemName: "Blessed Qiraji War Hammer" },
      { itemId: 20580, itemName: "Hammer of Bestial Fury" }
    ],
    18: [
      { itemId: 23198, itemName: "Idol of Brutality" }
    ]
  },
  "druid-resto-p6": {
    1: [
      { itemId: 16900, itemName: "Stormrage Cover" },
      { itemId: 19132, itemName: "Crystal Adorned Crown" },
      { itemId: 22490, itemName: "Dreamwalker Headpiece" },
      { itemId: 20628, itemName: "Deviate Growth Cap" },
      { itemId: 21615, itemName: "Don Rigoberto's Lost Hat" },
      { itemId: 21669, itemName: "Creeping Vine Helm" },
      { itemId: 22720, itemName: "Zulian Headdress" },
      { itemId: 13102, itemName: "Cassandra's Grace" },
      { itemId: 18727, itemName: "Crimson Felt Hat" }
    ],
    2: [
      { itemId: 23036, itemName: "Necklace of Necropsy" },
      { itemId: 21712, itemName: "Amulet of the Fallen God" },
      { itemId: 21507, itemName: "Amulet of the Shifting Sands" },
      { itemId: 19885, itemName: "Jin'do's Evil Eye" },
      { itemId: 18723, itemName: "Animated Chain Necklace" },
      { itemId: 19371, itemName: "Pendant of the Fallen Dragon" },
      { itemId: 17109, itemName: "Choker of Enlightenment" },
      { itemId: 22327, itemName: "Amulet of the Redeemed" }
    ],
    3: [
      { itemId: 16902, itemName: "Stormrage Pauldrons" },
      { itemId: 18810, itemName: "Wild Growth Spaulders" },
      { itemId: 22491, itemName: "Dreamwalker Spaulders" },
      { itemId: 21694, itemName: "Ternary Mantle" },
      { itemId: 19928, itemName: "Animist's Spaulders" },
      { itemId: 15061, itemName: "Living Shoulders" },
      { itemId: 22234, itemName: "Mantle of Lost Hope" },
      { itemId: 22405, itemName: "Mantle of the Scarlet Crusade" }
    ],
    5: [
      { itemId: 16897, itemName: "Stormrage Chestguard" },
      { itemId: 22488, itemName: "Dreamwalker Tunic" },
      { itemId: 21663, itemName: "Robes of the Guardian Saint" },
      { itemId: 13346, itemName: "Robes of the Exalted" },
      { itemId: 22272, itemName: "Forest's Embrace" }
    ],
    6: [
      { itemId: 16903, itemName: "Stormrage Belt" },
      { itemId: 22494, itemName: "Dreamwalker Girdle" },
      { itemId: 19162, itemName: "Corehound Belt" },
      { itemId: 21609, itemName: "Regenerating Belt of Vek'nilash" },
      { itemId: 21582, itemName: "Grasp of the Old God" },
      { itemId: 18391, itemName: "Eyestalk Cord" },
      { itemId: 19400, itemName: "Firemaw's Clutch" },
      { itemId: 18327, itemName: "Whipvine Cord" },
      { itemId: 19388, itemName: "Angelista's Grasp" },
      { itemId: 11662, itemName: "Ban'thok Sash" }
    ],
    7: [
      { itemId: 16901, itemName: "Stormrage Legguards" },
      { itemId: 19385, itemName: "Empowered Leggings" },
      { itemId: 22489, itemName: "Dreamwalker Legguards" },
      { itemId: 18875, itemName: "Salamander Scale Pants" },
      { itemId: 18682, itemName: "Ghoul Skin Leggings" },
      { itemId: 18386, itemName: "Padre's Trousers" },
      { itemId: 11841, itemName: "Senior Designer's Pantaloons" },
      { itemId: 19899, itemName: "Ritualistic Legguards" }
    ],
    8: [
      { itemId: 16898, itemName: "Stormrage Boots" },
      { itemId: 19437, itemName: "Boots of Pure Thought" },
      { itemId: 22492, itemName: "Dreamwalker Boots" },
      { itemId: 13954, itemName: "Verdant Footpads" },
      { itemId: 21810, itemName: "Treads of the Wandering Nomad" },
      { itemId: 19131, itemName: "Snowblind Shoes" },
      { itemId: 19897, itemName: "Betrayer's Boots" },
      { itemId: 18322, itemName: "Waterspout Boots" },
      { itemId: 22247, itemName: "Faith Healer's Boots" },
      { itemId: 18507, itemName: "Boots of the Full Moon" }
    ],
    9: [
      { itemId: 16904, itemName: "Stormrage Bracers" },
      { itemId: 22495, itemName: "Dreamwalker Wristguards" },
      { itemId: 21604, itemName: "Bracelets of Royal Redemption" },
      { itemId: 19840, itemName: "Zandalar Haruspex's Bracers" },
      { itemId: 19595, itemName: "Dryad's Wrist Bindings" },
      { itemId: 18525, itemName: "Bracers of Prosperity" },
      { itemId: 13208, itemName: "Bleak Howler Armguards" },
      { itemId: 18497, itemName: "Sublime Wristguards" }
    ],
    10: [
      { itemId: 16899, itemName: "Stormrage Handguards" },
      { itemId: 22493, itemName: "Dreamwalker Handguards" },
      { itemId: 21617, itemName: "Wasphide Gauntlets" },
      { itemId: 21462, itemName: "Gloves of Dark Wisdom" },
      { itemId: 21619, itemName: "Gloves of the Messiah" },
      { itemId: 18309, itemName: "Gloves of Restoration" },
      { itemId: 12554, itemName: "Hands of the Exalted Herald" },
      { itemId: 13253, itemName: "Hands of Power" }
    ],
    11: [
      { itemId: 22939, itemName: "Band of Unanswered Prayers" },
      { itemId: 19382, itemName: "Pure Elementium Band" },
      { itemId: 21620, itemName: "Ring of the Martyr" },
      { itemId: 19140, itemName: "Cauterizing Band" },
      { itemId: 19863, itemName: "Primalist's Seal" },
      { itemId: 19920, itemName: "Primalist's Band" },
      { itemId: 13178, itemName: "Rosewine Circle" },
      { itemId: 22334, itemName: "Band of Mending" },
      { itemId: 16058, itemName: "Fordring's Seal" },
      { itemId: 19397, itemName: "Ring of Blackrock" },
      { itemId: 22339, itemName: "Rune Band of Wizardry" }
    ],
    12: [
      { itemId: 22939, itemName: "Band of Unanswered Prayers" },
      { itemId: 19382, itemName: "Pure Elementium Band" },
      { itemId: 21620, itemName: "Ring of the Martyr" },
      { itemId: 19140, itemName: "Cauterizing Band" },
      { itemId: 19863, itemName: "Primalist's Seal" },
      { itemId: 19920, itemName: "Primalist's Band" },
      { itemId: 13178, itemName: "Rosewine Circle" },
      { itemId: 22334, itemName: "Band of Mending" },
      { itemId: 16058, itemName: "Fordring's Seal" },
      { itemId: 19397, itemName: "Ring of Blackrock" },
      { itemId: 22339, itemName: "Rune Band of Wizardry" }
    ],
    13: [
      { itemId: 19955, itemName: "Wushoolay's Charm of Nature" },
      { itemId: 23047, itemName: "Eye of the Dead" },
      { itemId: 19395, itemName: "Rejuvenating Gem" },
      { itemId: 20636, itemName: "Hibernation Crystal" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 18469, itemName: "Royal Seal of Eldre'Thalas" },
      { itemId: 12930, itemName: "Briarwood Reed" },
      { itemId: 22268, itemName: "Draconic Infused Emblem" },
      { itemId: 21625, itemName: "Scarab Brooch" },
      { itemId: 11819, itemName: "Second Wind" },
      { itemId: 11832, itemName: "Burst of Knowledge" }
    ],
    14: [
      { itemId: 19955, itemName: "Wushoolay's Charm of Nature" },
      { itemId: 23047, itemName: "Eye of the Dead" },
      { itemId: 19395, itemName: "Rejuvenating Gem" },
      { itemId: 20636, itemName: "Hibernation Crystal" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 18469, itemName: "Royal Seal of Eldre'Thalas" },
      { itemId: 12930, itemName: "Briarwood Reed" },
      { itemId: 22268, itemName: "Draconic Infused Emblem" },
      { itemId: 21625, itemName: "Scarab Brooch" },
      { itemId: 11819, itemName: "Second Wind" },
      { itemId: 11832, itemName: "Burst of Knowledge" }
    ],
    15: [
      { itemId: 22960, itemName: "Cloak of Suturing" },
      { itemId: 21583, itemName: "Cloak of Clarity" },
      { itemId: 18510, itemName: "Hide of the Wild" },
      { itemId: 19430, itemName: "Shroud of Pure Thought" },
      { itemId: 18208, itemName: "Drape of Benediction" },
      { itemId: 19870, itemName: "Hakkari Loa Cloak" },
      { itemId: 18389, itemName: "Cloak of the Cosmos" },
      { itemId: 19526, itemName: "Battle Healer's Cloak" },
      { itemId: 19530, itemName: "Caretaker's Cape" },
      { itemId: 22330, itemName: "Shroud of Arcane Mastery" }
    ],
    16: [
      { itemId: 23056, itemName: "Hammer of the Twisting Nether" },
      { itemId: 21839, itemName: "Scepter of the False Prophet" },
      { itemId: 22942, itemName: "The Widow's Embrace" },
      { itemId: 23464, itemName: "High Warlord's Battle Mace" },
      { itemId: 23454, itemName: "Grand Marshal's Warhammer" },
      { itemId: 21523, itemName: "Fang of Korialstrasz" },
      { itemId: 19360, itemName: "Lok'amir il Romathis" },
      { itemId: 19347, itemName: "Claw of Chromaggus" },
      { itemId: 19890, itemName: "Jin'do's Hexxer" },
      { itemId: 17105, itemName: "Aurastone Hammer" },
      { itemId: 11923, itemName: "The Hammer of Grace" },
      { itemId: 22632, itemName: "Atiesh, Greatstaff of the Guardian" },
      { itemId: 22801, itemName: "Spire of Twilight" },
      { itemId: 21275, itemName: "Blessed Qiraji Augur Staff" },
      { itemId: 20581, itemName: "Staff of Rampant Growth" },
      { itemId: 19909, itemName: "Will of Arlokk" },
      { itemId: 22406, itemName: "Redemption" },
      { itemId: 11932, itemName: "Guiding Stave of Wisdom" },
      { itemId: 22394, itemName: "Staff of Metanoia" }
    ],
    17: [
      { itemId: 23048, itemName: "Sapphiron's Right Eye" },
      { itemId: 23029, itemName: "Noth's Frigid Heart" },
      { itemId: 21666, itemName: "Sartura's Might" },
      { itemId: 19312, itemName: "Lei of the Lifegiver" },
      { itemId: 23453, itemName: "Grand Marshal's Tome of Restoration" },
      { itemId: 22319, itemName: "Tome of Divine Right" },
      { itemId: 18523, itemName: "Brightly Glowing Stone" },
      { itemId: 22329, itemName: "Scepter of Interminable Focus" }
    ],
    18: [
      { itemId: 22399, itemName: "Idol of Health" },
      { itemId: 22398, itemName: "Idol of Rejuvenation" },
      { itemId: 23004, itemName: "Idol of Longevity" }
    ]
  },
  "hunter-dps-p6": {
    1: [
      { itemId: 22438, itemName: "Cryptstalker Headpiece" },
      { itemId: 16465, itemName: "Field Marshal's Chain Helm" },
      { itemId: 16566, itemName: "Warlord's Chain Helmet" },
      { itemId: 23306, itemName: "Lieutenant Commander's Chain Helm" },
      { itemId: 23251, itemName: "Champion's Chain Helm" },
      { itemId: 21366, itemName: "Striker's Diadem" },
      { itemId: 16846, itemName: "Giantstalker's Helmet" },
      { itemId: 19875, itemName: "Bloodstained Coif" },
      { itemId: 22013, itemName: "Beastmaster's Cap" },
      { itemId: 22718, itemName: "Blooddrenched Mask" },
      { itemId: 18421, itemName: "Backwood Helm" },
      { itemId: 13359, itemName: "Crown of Tyranny" }
    ],
    2: [
      { itemId: 19377, itemName: "Prestor's Talisman of Connivery" },
      { itemId: 23053, itemName: "Stormrage's Talisman of Seething" },
      { itemId: 18404, itemName: "Onyxia Tooth Pendant" },
      { itemId: 21664, itemName: "Barbed Choker" },
      { itemId: 15411, itemName: "Mark of Fordring" },
      { itemId: 11933, itemName: "Imperial Jewel" },
      { itemId: 17044, itemName: "Will of the Martyr" }
    ],
    3: [
      { itemId: 22439, itemName: "Cryptstalker Spaulders" },
      { itemId: 16468, itemName: "Field Marshal's Chain Spaulders" },
      { itemId: 16568, itemName: "Warlord's Chain Shoulders" },
      { itemId: 16937, itemName: "Dragonstalker's Spaulders" },
      { itemId: 21665, itemName: "Mantle of Wicked Revenge" },
      { itemId: 21474, itemName: "Chitinous Shoulderguards" },
      { itemId: 21699, itemName: "Barrage Shoulders" },
      { itemId: 23307, itemName: "Lieutenant Commander's Chain Shoulders" },
      { itemId: 23252, itemName: "Champion's Chain Shoulders" },
      { itemId: 16848, itemName: "Giantstalker's Epaulets" },
      { itemId: 12927, itemName: "Truestrike Shoulders" },
      { itemId: 12082, itemName: "Wyrmhide Spaulders" },
      { itemId: 13358, itemName: "Wyrmtongue Shoulders" }
    ],
    5: [
      { itemId: 22436, itemName: "Cryptstalker Tunic" },
      { itemId: 21370, itemName: "Striker's Hauberk" },
      { itemId: 16942, itemName: "Dragonstalker's Breastplate" },
      { itemId: 16466, itemName: "Field Marshal's Chain Breastplate" },
      { itemId: 16565, itemName: "Warlord's Chain Chestpiece" },
      { itemId: 22874, itemName: "Legionnaire's Chain Hauberk" }
    ],
    6: [
      { itemId: 22442, itemName: "Cryptstalker Girdle" },
      { itemId: 21463, itemName: "Ossirian's Binding" },
      { itemId: 16936, itemName: "Dragonstalker's Belt" },
      { itemId: 16851, itemName: "Giantstalker's Belt" },
      { itemId: 19832, itemName: "Zandalar Predator's Belt" },
      { itemId: 18393, itemName: "Warpwood Binding" },
      { itemId: 22232, itemName: "Marksman's Girdle" }
    ],
    7: [
      { itemId: 23071, itemName: "Leggings of Apocalypse" },
      { itemId: 22437, itemName: "Cryptstalker Legguards" },
      { itemId: 22748, itemName: "Sentinel's Chain Leggings" },
      { itemId: 22673, itemName: "Outrider's Chain Leggings" },
      { itemId: 16467, itemName: "Marshal's Chain Legguards" },
      { itemId: 16567, itemName: "General's Chain Legguards" },
      { itemId: 16938, itemName: "Dragonstalker's Legguards" },
      { itemId: 21368, itemName: "Striker's Leggings" },
      { itemId: 16847, itemName: "Giantstalker's Leggings" },
      { itemId: 19887, itemName: "Bloodstained Legplates" },
      { itemId: 22017, itemName: "Beastmaster's Pants" },
      { itemId: 15062, itemName: "Devilsaur Leggings" }
    ],
    8: [
      { itemId: 22440, itemName: "Cryptstalker Boots" },
      { itemId: 16462, itemName: "Marshal's Chain Boots" },
      { itemId: 16569, itemName: "General's Chain Sabatons" },
      { itemId: 21365, itemName: "Striker's Footguards" },
      { itemId: 16941, itemName: "Dragonstalker's Greaves" },
      { itemId: 16849, itemName: "Giantstalker's Boots" },
      { itemId: 22061, itemName: "Beastmaster's Boots" },
      { itemId: 18506, itemName: "Mongoose Boots" },
      { itemId: 19919, itemName: "Bloodstained Greaves" },
      { itemId: 13967, itemName: "Windreaver Greaves" }
    ],
    9: [
      { itemId: 22443, itemName: "Cryptstalker Wristguards" },
      { itemId: 18812, itemName: "Wristguards of True Flight" },
      { itemId: 16935, itemName: "Dragonstalker's Bracers" },
      { itemId: 16850, itemName: "Giantstalker's Bracers" },
      { itemId: 19687, itemName: "Primal Batskin Bracers" },
      { itemId: 22011, itemName: "Beastmaster's Bindings" },
      { itemId: 13211, itemName: "Slashclaw Bracers" },
      { itemId: 18375, itemName: "Bracers of the Eclipse" }
    ],
    10: [
      { itemId: 16463, itemName: "Marshal's Chain Grips" },
      { itemId: 16571, itemName: "General's Chain Gloves" },
      { itemId: 22441, itemName: "Cryptstalker Handguards" },
      { itemId: 21599, itemName: "Vek'lor's Gloves of Devastation" },
      { itemId: 16940, itemName: "Dragonstalker's Gauntlets" },
      { itemId: 16852, itemName: "Giantstalker's Gloves" },
      { itemId: 22715, itemName: "Gloves of the Tormented" },
      { itemId: 15063, itemName: "Devilsaur Gauntlets" }
    ],
    11: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 22961, itemName: "Band of Reanimation" },
      { itemId: 23067, itemName: "Ring of the Cryptstalker" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 21596, itemName: "Ring of the Godslayer" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19325, itemName: "Don Julio's Band" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19925, itemName: "Band of Jin" },
      { itemId: 19898, itemName: "Seal of Jin" },
      { itemId: 18500, itemName: "Tarnished Elven Ring" },
      { itemId: 17713, itemName: "Blackstone Ring" },
      { itemId: 13098, itemName: "Painweaver Band" }
    ],
    12: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 22961, itemName: "Band of Reanimation" },
      { itemId: 23067, itemName: "Ring of the Cryptstalker" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" },
      { itemId: 21596, itemName: "Ring of the Godslayer" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19325, itemName: "Don Julio's Band" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19925, itemName: "Band of Jin" },
      { itemId: 19898, itemName: "Seal of Jin" },
      { itemId: 18500, itemName: "Tarnished Elven Ring" },
      { itemId: 17713, itemName: "Blackstone Ring" },
      { itemId: 13098, itemName: "Painweaver Band" }
    ],
    13: [
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 19953, itemName: "Renataki's Charm of Beasts" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23570, itemName: "Jom Gabbar" },
      { itemId: 13965, itemName: "Blackhand's Breadth" },
      { itemId: 13209, itemName: "Seal of the Dawn" }
    ],
    14: [
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 19953, itemName: "Renataki's Charm of Beasts" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23570, itemName: "Jom Gabbar" },
      { itemId: 13965, itemName: "Blackhand's Breadth" },
      { itemId: 13209, itemName: "Seal of the Dawn" }
    ],
    15: [
      { itemId: 21710, itemName: "Cloak of the Fallen God" },
      { itemId: 23045, itemName: "Shroud of Dominion" },
      { itemId: 21403, itemName: "Cloak of the Unseen Path" },
      { itemId: 21701, itemName: "Cloak of Concentrated Hatred" },
      { itemId: 21187, itemName: "Earthweave Cloak" },
      { itemId: 17102, itemName: "Cloak of the Shrouded Mists" },
      { itemId: 13340, itemName: "Cape of the Black Baron" },
      { itemId: 19436, itemName: "Cloak of Draconic Might" },
      { itemId: 19907, itemName: "Zulian Tigerhide Cloak" },
      { itemId: 13122, itemName: "Dark Phantom Cape" },
      { itemId: 11626, itemName: "Blackveil Cape" }
    ],
    16: [
      { itemId: 23039, itemName: "The Eye of Nerub" },
      { itemId: 22815, itemName: "Severance" },
      { itemId: 21635, itemName: "Barb of the Sand Reaver" },
      { itemId: 22691, itemName: "Corrupted Ashbringer" },
      { itemId: 19962, itemName: "Gri'lek's Carver" },
      { itemId: 22813, itemName: "Claymore of Unholy Might" },
      { itemId: 22802, itemName: "Kingsfall" },
      { itemId: 23044, itemName: "Harbinger of Doom" },
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 21244, itemName: "Blessed Qiraji Pugio" },
      { itemId: 22816, itemName: "Hatchet of Sundered Bone" }
    ],
    17: [
      { itemId: 23242, itemName: "Claw of the Frost Wyrm" },
      { itemId: 22802, itemName: "Kingsfall" },
      { itemId: 22816, itemName: "Hatchet of Sundered Bone" },
      { itemId: 23044, itemName: "Harbinger of Doom" },
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 21244, itemName: "Blessed Qiraji Pugio" }
    ],
    18: [
      { itemId: 22812, itemName: "Nerubian Slavemaker" },
      { itemId: 19361, itemName: "Ashjre'thul, Crossbow of Smiting" },
      { itemId: 22811, itemName: "Soulstring" },
      { itemId: 23557, itemName: "Larvae of the Great Worm" },
      { itemId: 18855, itemName: "Grand Marshal's Hand Cannon" },
      { itemId: 18860, itemName: "High Warlord's Street Sweeper" },
      { itemId: 18836, itemName: "Grand Marshal's Repeater" },
      { itemId: 18837, itemName: "High Warlord's Crossbow" }
    ]
  },
  "mage-dps-p6": {
    1: [
      { itemId: 22498, itemName: "Frostfire Circlet" },
      { itemId: 19375, itemName: "Mish'undare, Circlet of the Mind Flayer" },
      { itemId: 23035, itemName: "Preceptor's Hat" },
      { itemId: 21347, itemName: "Enigma Circlet" },
      { itemId: 16441, itemName: "Field Marshal's Coronet" },
      { itemId: 16533, itemName: "Warlord's Silk Cowl" },
      { itemId: 23318, itemName: "Lieutenant Commander's Silk Cowl" },
      { itemId: 23263, itemName: "Champion's Silk Cowl" }
    ],
    2: [
      { itemId: 21608, itemName: "Amulet of Vek'nilash" },
      { itemId: 23057, itemName: "Gem of Trapped Innocents" },
      { itemId: 18814, itemName: "Choker of the Fire Lord" },
      { itemId: 22943, itemName: "Malice Stone Pendant" },
      { itemId: 21504, itemName: "Charm of the Shifting Sands" },
      { itemId: 19426, itemName: "Orb of the Darkmoon" },
      { itemId: 19923, itemName: "Jeklik's Opaline Talisman" },
      { itemId: 17109, itemName: "Choker of Enlightenment" }
    ],
    3: [
      { itemId: 22983, itemName: "Rime Covered Mantle" },
      { itemId: 22499, itemName: "Frostfire Shoulderpads" },
      { itemId: 19370, itemName: "Mantle of the Blackwing Cabal" },
      { itemId: 21686, itemName: "Mantle of Phrenic Power" },
      { itemId: 21345, itemName: "Enigma Shoulderpads" },
      { itemId: 23319, itemName: "Lieutenant Commander's Silk Mantle" },
      { itemId: 23264, itemName: "Champion's Silk Mantle" },
      { itemId: 16444, itemName: "Field Marshal's Silk Spaulders" }
    ],
    5: [
      { itemId: 22496, itemName: "Frostfire Robe" },
      { itemId: 23220, itemName: "Crystal Webbed Robe" },
      { itemId: 21343, itemName: "Enigma Robes" },
      { itemId: 19682, itemName: "Bloodvine Vest" },
      { itemId: 20034, itemName: "Zandalar Illusionist's Robe" },
      { itemId: 19145, itemName: "Robe of Volatile Power" },
      { itemId: 16443, itemName: "Field Marshal's Silk Vestments" },
      { itemId: 16535, itemName: "Warlord's Silk Raiment" },
      { itemId: 23305, itemName: "Knight-Captain's Silk Tunic" },
      { itemId: 22886, itemName: "Legionnaire's Silk Tunic" },
      { itemId: 14152, itemName: "Robe of the Archmage" },
      { itemId: 20635, itemName: "Jade Inlaid Vestments" },
      { itemId: 16916, itemName: "Netherwind Robes" },
      { itemId: 18385, itemName: "Robe of Everlasting Night" },
      { itemId: 16798, itemName: "Arcanist Robes" },
      { itemId: 14340, itemName: "Freezing Lich Robes" },
      { itemId: 14136, itemName: "Robe of Winter Night" }
    ],
    6: [
      { itemId: 22730, itemName: "Eyestalk Waist Cord" },
      { itemId: 19136, itemName: "Mana Igniting Cord" },
      { itemId: 19400, itemName: "Firemaw's Clutch" },
      { itemId: 22502, itemName: "Frostfire Belt" },
      { itemId: 22716, itemName: "Belt of Untapped Power" },
      { itemId: 16818, itemName: "Netherwind Belt" },
      { itemId: 20047, itemName: "Highlander's Cloth Girdle" },
      { itemId: 20163, itemName: "Defiler's Cloth Girdle" },
      { itemId: 11662, itemName: "Ban'thok Sash" },
      { itemId: 19094, itemName: "Stormpike Cloth Girdle" },
      { itemId: 19090, itemName: "Frostwolf Cloth Belt" },
      { itemId: 16802, itemName: "Arcanist Belt" },
      { itemId: 19388, itemName: "Angelista's Grasp" }
    ],
    7: [
      { itemId: 23070, itemName: "Leggings of Polarity" },
      { itemId: 21676, itemName: "Leggings of the Festering Swarm" },
      { itemId: 21461, itemName: "Leggings of the Black Blizzard" },
      { itemId: 22497, itemName: "Frostfire Leggings" },
      { itemId: 21346, itemName: "Enigma Leggings" },
      { itemId: 19683, itemName: "Bloodvine Leggings" },
      { itemId: 16915, itemName: "Netherwind Pants" },
      { itemId: 23304, itemName: "Knight-Captain's Silk Legguards" },
      { itemId: 22883, itemName: "Legionnaire's Silk Legguards" },
      { itemId: 16442, itemName: "Marshal's Silk Leggings" },
      { itemId: 16534, itemName: "General's Silk Trousers" },
      { itemId: 16796, itemName: "Arcanist Leggings" },
      { itemId: 13170, itemName: "Skyshroud Leggings" },
      { itemId: 19895, itemName: "Bloodtinged Kilt" },
      { itemId: 22747, itemName: "Outrider's Silk Leggings" },
      { itemId: 22752, itemName: "Sentinel's Silk Leggings" }
    ],
    8: [
      { itemId: 22500, itemName: "Frostfire Sandals" },
      { itemId: 21600, itemName: "Boots of Epiphany" },
      { itemId: 19131, itemName: "Snowblind Shoes" },
      { itemId: 19897, itemName: "Betrayer's Boots" },
      { itemId: 21344, itemName: "Enigma Boots" },
      { itemId: 16912, itemName: "Netherwind Boots" },
      { itemId: 19684, itemName: "Bloodvine Boots" }
    ],
    9: [
      { itemId: 23021, itemName: "The Soul Harvester's Bindings" },
      { itemId: 21611, itemName: "Burrower Bracers" },
      { itemId: 22503, itemName: "Frostfire Bindings" },
      { itemId: 21186, itemName: "Rockfury Bracers" },
      { itemId: 20626, itemName: "Black Bark Wristbands" },
      { itemId: 19595, itemName: "Dryad's Wrist Bindings" },
      { itemId: 19374, itemName: "Bracers of Arcane Accuracy" },
      { itemId: 16918, itemName: "Netherwind Bindings" },
      { itemId: 19846, itemName: "Zandalar Illusionist's Wraps" },
      { itemId: 16799, itemName: "Arcanist Bindings" },
      { itemId: 18497, itemName: "Sublime Wristguards" }
    ],
    10: [
      { itemId: 21585, itemName: "Dark Storm Gauntlets" },
      { itemId: 22501, itemName: "Frostfire Gloves" },
      { itemId: 18808, itemName: "Gloves of the Hypnotic Flame" },
      { itemId: 18408, itemName: "Inferno Gloves" },
      { itemId: 16913, itemName: "Netherwind Gloves" },
      { itemId: 20618, itemName: "Gloves of Delusional Power" },
      { itemId: 19929, itemName: "Bloodtinged Gloves" },
      { itemId: 16440, itemName: "Marshal's Silk Gloves" },
      { itemId: 16540, itemName: "General's Silk Handguards" },
      { itemId: 13253, itemName: "Hands of Power" },
      { itemId: 23290, itemName: "Knight-Lieutenant's Silk Handwraps" },
      { itemId: 22870, itemName: "Blood Guard's Silk Handwraps" }
    ],
    11: [
      { itemId: 23237, itemName: "Ring of the Eternal Flame" },
      { itemId: 23062, itemName: "Frostfire Ring" },
      { itemId: 21709, itemName: "Ring of the Fallen God" },
      { itemId: 23031, itemName: "Band of the Inevitable" },
      { itemId: 21836, itemName: "Ritssyn's Ring of Chaos" },
      { itemId: 19147, itemName: "Ring of Spell Power" },
      { itemId: 20632, itemName: "Mindtear Band" },
      { itemId: 23025, itemName: "Seal of the Damned" }
    ],
    12: [
      { itemId: 23237, itemName: "Ring of the Eternal Flame" },
      { itemId: 23062, itemName: "Frostfire Ring" },
      { itemId: 21709, itemName: "Ring of the Fallen God" },
      { itemId: 23031, itemName: "Band of the Inevitable" },
      { itemId: 21836, itemName: "Ritssyn's Ring of Chaos" },
      { itemId: 19147, itemName: "Ring of Spell Power" },
      { itemId: 20632, itemName: "Mindtear Band" },
      { itemId: 23025, itemName: "Seal of the Damned" }
    ],
    13: [
      { itemId: 19379, itemName: "Neltharion's Tear" },
      { itemId: 23046, itemName: "The Restrained Essence of Sapphiron" },
      { itemId: 23207, itemName: "Mark of the Champion" },
      { itemId: 19339, itemName: "Mind Quickening Gem" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 18820, itemName: "Talisman of Ephemeral Power" },
      { itemId: 12930, itemName: "Briarwood Reed" },
      { itemId: 13968, itemName: "Eye of the Beast" }
    ],
    14: [
      { itemId: 19379, itemName: "Neltharion's Tear" },
      { itemId: 23046, itemName: "The Restrained Essence of Sapphiron" },
      { itemId: 23207, itemName: "Mark of the Champion" },
      { itemId: 19339, itemName: "Mind Quickening Gem" },
      { itemId: 19950, itemName: "Zandalarian Hero Charm" },
      { itemId: 18820, itemName: "Talisman of Ephemeral Power" },
      { itemId: 12930, itemName: "Briarwood Reed" },
      { itemId: 13968, itemName: "Eye of the Beast" }
    ],
    15: [
      { itemId: 23050, itemName: "Cloak of the Necropolis" },
      { itemId: 22731, itemName: "Cloak of the Devoured" },
      { itemId: 19378, itemName: "Cloak of the Brood Lord" },
      { itemId: 23017, itemName: "Veil of Eclipse" },
      { itemId: 19857, itemName: "Cloak of Consumption" },
      { itemId: 22711, itemName: "Cloak of the Hakkari Worshippers" },
      { itemId: 20697, itemName: "Crystalline Threaded Cape" },
      { itemId: 17078, itemName: "Sapphiron Drape" },
      { itemId: 11623, itemName: "Spritecaster Cape" },
      { itemId: 18350, itemName: "Amplifying Cloak" },
      { itemId: 19086, itemName: "Stormpike Sage's Cloak" },
      { itemId: 19085, itemName: "Frostwolf Advisor's Cloak" }
    ],
    16: [
      { itemId: 22589, itemName: "Atiesh, Greatstaff of the Guardian" },
      { itemId: 22799, itemName: "Soulseeker" },
      { itemId: 22800, itemName: "Brimstone Staff" },
      { itemId: 19356, itemName: "Staff of the Shadow Flame" },
      { itemId: 21273, itemName: "Blessed Qiraji Acolyte Staff" },
      { itemId: 18873, itemName: "Grand Marshal's Stave" },
      { itemId: 18874, itemName: "High Warlord's War Staff" },
      { itemId: 22807, itemName: "Wraith Blade" },
      { itemId: 22803, itemName: "Midnight Haze" },
      { itemId: 23451, itemName: "Grand Marshal's Mageblade" },
      { itemId: 23466, itemName: "High Warlord's Spellblade" },
      { itemId: 21622, itemName: "Sharpened Silithid Femur" },
      { itemId: 19347, itemName: "Claw of Chromaggus" },
      { itemId: 17103, itemName: "Azuresong Mageblade" },
      { itemId: 17070, itemName: "Fang of the Mystics" }
    ],
    17: [
      { itemId: 23049, itemName: "Sapphiron's Left Eye" },
      { itemId: 19311, itemName: "Tome of Fiery Arcana" },
      { itemId: 21597, itemName: "Royal Scepter of Vek'lor" },
      { itemId: 21471, itemName: "Talon of Furious Concentration" },
      { itemId: 19366, itemName: "Master Dragonslayer's Orb" },
      { itemId: 19891, itemName: "Jin'do's Bag of Whammies" },
      { itemId: 20582, itemName: "Trance Stone" },
      { itemId: 23452, itemName: "Grand Marshal's Tome of Power" }
    ],
    18: [
      { itemId: 22821, itemName: "Doomfinger" },
      { itemId: 21603, itemName: "Wand of Qiraji Nobility" },
      { itemId: 19861, itemName: "Touch of Chaos" },
      { itemId: 22820, itemName: "Wand of Fates" },
      { itemId: 11748, itemName: "Pyric Caduceus" },
      { itemId: 13938, itemName: "Bonecreeper Stylus" },
      { itemId: 18301, itemName: "Lethendris's Wand" },
      { itemId: 19367, itemName: "Dragon's Touch" }
    ]
  },
  "paladin-retribution-p6": {
    1: [21387, 19372, 21460, 12640, 16474, 18817, 12587, 13404],
    2: [23053, 21664, 19856, 18404, 19377, 21505, 15411, 11933],
    3: [23667, 21391, 21665, 19394, 16476, 23277, 12927],
    5: [23226, 23000, 21389, 21814, 11726, 16473, 19904, 19405, 14637, 13944, 18530, 11926],
    6: [23219, 19137, 21692, 19380, 21463, 19392, 13959, 13142],
    7: [23068, 23071, 21390, 19402, 16475, 21495, 14554, 18380, 15062],
    8: [21388, 21493, 19387, 21688, 21490, 16472, 12555, 13967, 14616, 23275],
    9: [22936, 21618, 21457, 19578, 19146, 18812, 13400, 12936],
    10: [21581, 21672, 19143, 22714, 21623, 19157, 15063, 13957],
    11: [23038, 18821, 19432, 21677, 19325, 19384, 21205, 17063, 17713, 13098, 12548],
    12: [23038, 18821, 19432, 21677, 19325, 19384, 21205, 17063, 17713, 13098, 12548],
    13: [19343, 22954, 23206, 11815, 21180, 13965],
    14: [19343, 22954, 23206, 11815, 21180, 13965],
    15: [21710, 23045, 21701, 22712, 13397, 13340, 13203, 22337],
    16: [22798, 22691, 17182, 19364, 19334, 18876, 21679, 19169, 17076, 18822],
    18: [23203, 22401]
  },
  "paladin-holy-p6": {
    1: [22428, 19132, 21615, 20628, 21669, 22720, 18490, 12633, 18727, 14979],
    2: [21712, 23036, 21507, 19885, 18723, 17109, 22327],
    3: [18810, 22429, 21683, 21694, 19928, 15061, 14548, 22234, 22405, 18681],
    5: [22425, 21663, 13346, 15047, 18373],
    6: [19162, 22431, 21582, 21609, 18702, 18391, 19400, 21606, 18327],
    7: [19385, 21667, 22427, 18875, 18386, 20266, 18682, 11841, 19899, 10389],
    8: [19437, 22430, 21704, 21810, 19131, 19897, 13954, 20265, 18322, 22247],
    9: [21604, 22424, 18459, 13969, 19595, 18525, 13208, 18497],
    10: [20264, 22426, 21617, 18527, 21462, 21619, 18309, 12554, 13253],
    11: [19382, 22939, 21620, 19140, 23066, 19863, 19920, 13178, 22334, 16058, 19397],
    12: [19382, 22939, 21620, 19140, 23066, 19863, 19920, 13178, 22334, 16058, 19397],
    13: [23047, 19395, 21625, 19343, 20636, 18637, 19950, 22268, 12930, 11819, 18472],
    14: [23047, 19395, 21625, 19343, 20636, 18637, 19950, 22268, 12930, 11819, 18472],
    15: [22960, 21583, 18510, 19430, 18208, 19870, 13386, 18389, 19526, 19530],
    16: [23056, 21839, 22942, 23464, 23454, 19360, 19890, 17103, 21466, 17105, 11923, 22713, 22315, 18321],
    17: [22819, 23048, 21666, 23029, 19312, 21610, 23075, 19348, 22319, 18523, 11928],
    18: [23006, 23201, 22402]
  },
  "priest-shadow-p6": {
    1: [23035],
    2: [18814],
    3: [22983],
    5: [23220],
    6: [22730],
    7: [19133],
    8: [21600],
    9: [21611],
    10: [21585],
    11: [21709, 23031, 21210, 21190, 19434],
    12: [21709, 23031, 21210, 21190, 19434],
    13: [19379, 23046, 23207, 18820, 19950],
    14: [19379, 23046, 23207, 18820, 19950],
    15: [22731],
    16: [22988, 22803, 19360, 23451, 22799, 22800, 19356, 21273, 18873],
    17: [19309, 23049, 19366, 21597, 21471],
    18: [21603, 22821, 22820, 19861]
  },
  "priest-holy-p6": {
    1: [16921],
    2: [23036],
    3: [16924],
    5: [16923],
    6: [16925],
    7: [16922],
    8: [16919],
    9: [16926],
    10: [16920],
    11: [23061, 22939, 19382, 21620, 19140],
    12: [23061, 22939, 19382, 21620, 19140],
    13: [19958, 23047, 19395, 21625, 20636],
    14: [19958, 23047, 19395, 21625, 20636],
    15: [22960],
    16: [23056, 21839, 22942, 23464, 21523, 22631, 22801, 21275, 18608],
    17: [23048, 23029, 21666, 19312],
    18: [23009, 15283, 15282, 21801, 22254]
  },
  "rogue-swords-p6": {
    1: [22478],
    2: [19377],
    3: [22479],
    5: [21364],
    6: [
      { itemId: 22482, itemName: "Bonescythe Waistguard" },
      { itemId: 16910, itemName: "Bloodfang Belt" },
      { itemId: 16827, itemName: "Nightslayer Belt" }
    ],
    7: [22477],
    8: [22480],
    9: [
      { itemId: 22483, itemName: "Bonescythe Bracers" },
      { itemId: 16911, itemName: "Bloodfang Bracers" },
      { itemId: 22004, itemName: "Darkmantle Bracers" }
    ],
    10: [
      { itemId: 22481, itemName: "Bonescythe Gauntlets" },
      { itemId: 21672, itemName: "Gloves of Enforcement" },
      { itemId: 18823, itemName: "Aged Core Leather Gloves" }
    ],
    11: [23060, 23038, 17063, 22961, 21205],
    12: [23060, 23038, 17063, 22961, 21205],
    13: [22954, 23041, 23206, 23570, 21180],
    14: [22954, 23041, 23206, 23570, 21180],
    15: [
      { itemId: 21710, itemName: "Cloak of the Fallen God" },
      { itemId: 23045, itemName: "Shroud of Dominion" },
      { itemId: 21406, itemName: "Cloak of Veiled Shadows" },
      { itemId: 18541, itemName: "Puissant Cape" }
    ],
    16: [
      { itemId: 23054, itemName: "Gressil, Dawn of Ruin" },
      { itemId: 12584, itemName: "Grand Marshal's Longsword" },
      { itemId: 16345, itemName: "High Warlord's Blade" },
      { itemId: 19352, itemName: "Chromatically Tempered Sword" },
      { itemId: 20577, itemName: "Nightmare Blade" },
      { itemId: 18832, itemName: "Brutality Blade" }
    ],
    17: [
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 23577, itemName: "The Hungering Cold" },
      { itemId: 19351, itemName: "Maladath, Runed Blade of the Black Flight" },
      { itemId: 19019, itemName: "Thunderfury, Blessed Blade of the Windseeker" },
      { itemId: 22806, itemName: "Widow's Remorse" },
      { itemId: 23456, itemName: "Grand Marshal's Swiftblade" },
      { itemId: 23467, itemName: "High Warlord's Quickblade" }
    ],
    18: [22812, 21616, 22811, 21459, 17069]
  },
  "rogue-daggers-p6": {
    1: [22478],
    2: [19377],
    3: [22479],
    5: [21364],
    6: [
      { itemId: 21586, itemName: "Belt of Never-Ending Agony" },
      { itemId: 22482, itemName: "Bonescythe Waistguard" },
      { itemId: 16910, itemName: "Bloodfang Belt" },
      { itemId: 16827, itemName: "Nightslayer Belt" },
      { itemId: 20216, itemName: "Belt of Preserved Heads" }
    ],
    7: [22477],
    8: [22480],
    9: [
      { itemId: 21602, itemName: "Qiraji Execution Bracers" },
      { itemId: 22483, itemName: "Bonescythe Bracers" },
      { itemId: 16911, itemName: "Bloodfang Bracers" },
      { itemId: 22004, itemName: "Darkmantle Bracers" }
    ],
    10: [
      { itemId: 18823, itemName: "Aged Core Leather Gloves" },
      { itemId: 22481, itemName: "Bonescythe Gauntlets" },
      { itemId: 21672, itemName: "Gloves of Enforcement" },
      { itemId: 22006, itemName: "Darkmantle Gloves" }
    ],
    11: [23060, 23038, 17063, 22961, 21205],
    12: [23060, 23038, 17063, 22961, 21205],
    13: [22954, 23041, 23206, 23570, 21180],
    14: [22954, 23041, 23206, 23570, 21180],
    15: [
      { itemId: 21701, itemName: "Cloak of Concentrated Hatred" },
      { itemId: 21406, itemName: "Cloak of Veiled Shadows" },
      { itemId: 18541, itemName: "Puissant Cape" }
    ],
    16: [
      { itemId: 21126, itemName: "Death's Sting" },
      { itemId: 22804, itemName: "Maexxna's Fang" },
      { itemId: 23044, itemName: "Harbinger of Doom" },
      { itemId: 21244, itemName: "Blessed Qiraji Pugio" },
      { itemId: 21650, itemName: "Ancient Qiraji Ripper" },
      { itemId: 18838, itemName: "Grand Marshal's Dirk" },
      { itemId: 18840, itemName: "High Warlord's Razor" }
    ],
    17: [
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 23577, itemName: "The Hungering Cold" },
      { itemId: 19351, itemName: "Maladath, Runed Blade of the Black Flight" },
      { itemId: 19019, itemName: "Thunderfury, Blessed Blade of the Windseeker" },
      { itemId: 22806, itemName: "Widow's Remorse" },
      { itemId: 23456, itemName: "Grand Marshal's Swiftblade" },
      { itemId: 23467, itemName: "High Warlord's Quickblade" }
    ],
    18: [22812, 21616, 22811, 21459, 17069]
  },
  "shaman-elemental-p6": {
    1: [19375],
    2: [21608],
    3: [23664],
    5: [21838],
    6: [22730],
    7: [23070],
    8: [21600],
    9: [21186],
    10: [21585],
    11: [21709, 23031, 23025, 19403, 21190],
    12: [21709, 23031, 23025, 19403, 21190],
    13: [19344, 23207, 23046, 19379],
    14: [19344, 23207, 23046, 19379],
    15: [23050],
    16: [22988, 19360, 22803, 23466],
    17: [23049, 21597, 19891]
  },
  "shaman-enhancement-p6": {
    1: [18817],
    2: [23053],
    3: [21665],
    5: [23226],
    6: [21586],
    7: [23071],
    8: [19381],
    9: [21602],
    10: [21672],
    11: [23038, 21677, 18821, 19325, 19384],
    12: [23038, 21677, 18821, 19325, 19384],
    13: [23041, 22954, 19406, 11815],
    14: [23041, 22954, 19406, 11815],
    15: [23045],
    16: [22798, 21134, 18831, 22815, 17182]
  },
  "shaman-resto-p6": {
    1: [22466],
    2: [21712],
    3: [22467],
    5: [22464],
    6: [21582],
    7: [22465],
    8: [16949],
    9: [16943],
    10: [16948, 22819],
    11: [21620, 23065, 19382, 22939, 19140],
    12: [21620, 23065, 19382, 22939, 19140],
    13: [23047, 19395, 20636, 19344, 19950],
    14: [23047, 19395, 20636, 19344, 19950],
    15: [21583],
    16: [23056, 21839, 22942, 23464, 19360, 22801, 21275],
    17: [22819, 23048, 21666, 23029, 19312],
    18: [22396]
  },
  "warlock-dps-p6": {
    1: [22506],
    2: [23057],
    3: [22507],
    5: [22504],
    6: [22730],
    7: [23070],
    8: [22508],
    9: [19374],
    10: [21585],
    11: [21709, 23031, 23025, 19403, 21417],
    12: [21709, 23031, 23025, 19403, 21417],
    13: [23207, 23046, 19379, 18820, 21473],
    14: [23207, 23046, 19379, 18820, 21473],
    15: [23050],
    16: [22807, 22803, 23466, 21622, 17103, 22630, 22800, 22799, 21273, 19356],
    17: [23049, 21597, 19891, 22329, 19366],
    18: [22820, 22821, 21603, 19861, 13396]
  },
  "warrior-fury-p6": {
    1: [
      { itemId: 12640, itemName: "Lionheart Helm" },
      { itemId: 19372, itemName: "Helm of Endless Rage" },
      { itemId: 21329, itemName: "Conqueror's Crown" },
      { itemId: 21455, itemName: "Southwind Helm" },
      { itemId: 18817, itemName: "Crown of Destruction" },
      { itemId: 16478, itemName: "Field Marshal's Plate Helm" },
      { itemId: 16542, itemName: "Warlord's Plate Headpiece" },
      { itemId: 19945, itemName: "Lizardscale Eyepatch" },
      { itemId: 23314, itemName: "Lieutenant Commander's Plate Helm" },
      { itemId: 23244, itemName: "Champion's Plate Helm" }
    ],
    2: [
      { itemId: 23053, itemName: "Stormrage's Talisman of Seething" },
      { itemId: 21664, itemName: "Barbed Choker" },
      { itemId: 19856, itemName: "The Eye of Hakkar" },
      { itemId: 18404, itemName: "Onyxia Tooth Pendant" },
      { itemId: 21809, itemName: "Fury of the Forgotten Swarm" }
    ],
    3: [
      { itemId: 21330, itemName: "Conqueror's Spaulders" },
      { itemId: 21665, itemName: "Mantle of Wicked Revenge" },
      { itemId: 16480, itemName: "Field Marshal's Plate Shoulderguards" },
      { itemId: 16544, itemName: "Warlord's Plate Shoulders" },
      { itemId: 19394, itemName: "Drake Talon Pauldrons" },
      { itemId: 23315, itemName: "Lieutenant Commander's Plate Shoulders" },
      { itemId: 23243, itemName: "Champion's Plate Shoulders" }
    ],
    5: [
      { itemId: 23000, itemName: "Plated Abomination Ribcage" },
      { itemId: 23226, itemName: "Ghoul Skin Tunic" },
      { itemId: 21814, itemName: "Breastplate of Annihilation" },
      { itemId: 21331, itemName: "Conqueror's Breastplate" },
      { itemId: 21680, itemName: "Vest of Swift Execution" },
      { itemId: 11726, itemName: "Savage Gladiator Chain" }
    ],
    6: [
      { itemId: 23219, itemName: "Girdle of the Mentor" },
      { itemId: 19137, itemName: "Onslaught Girdle" },
      { itemId: 21586, itemName: "Belt of Never-ending Agony" },
      { itemId: 21692, itemName: "Triad Girdle" },
      { itemId: 19823, itemName: "Zandalar Vindicator's Belt" }
    ],
    7: [
      { itemId: 23068, itemName: "Legplates of Carnage" },
      { itemId: 23071, itemName: "Leggings of Apocalypse" },
      { itemId: 21332, itemName: "Conqueror's Legguards" },
      { itemId: 22385, itemName: "Titanic Leggings" },
      { itemId: 16479, itemName: "Marshal's Plate Legguards" },
      { itemId: 16543, itemName: "General's Plate Leggings" },
      { itemId: 21651, itemName: "Scaled Sand Reaver Leggings" }
    ],
    8: [
      { itemId: 19387, itemName: "Chromatic Boots" },
      { itemId: 21493, itemName: "Boots of the Vanguard" },
      { itemId: 21688, itemName: "Boots of the Fallen Hero" },
      { itemId: 16483, itemName: "Marshal's Plate Boots" },
      { itemId: 16545, itemName: "General's Plate Boots" },
      { itemId: 21490, itemName: "Slime Kickers" }
    ],
    9: [
      { itemId: 22936, itemName: "Wristguards of Vengeance" },
      { itemId: 21618, itemName: "Hive Defiler Wristguards" },
      { itemId: 21602, itemName: "Qiraji Execution Bracers" },
      { itemId: 21457, itemName: "Bracers of Brutality" },
      { itemId: 21184, itemName: "Deeprock Bracers" }
    ],
    10: [
      { itemId: 21581, itemName: "Gauntlets of Annihilation" },
      { itemId: 14551, itemName: "Edgemaster's Handguards" },
      { itemId: 21672, itemName: "Gloves of Enforcement" },
      { itemId: 22714, itemName: "Sacrificial Gauntlets" }
    ],
    11: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19432, itemName: "Circle of Applied Force" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19325, itemName: "Don Julio's Band" },
      { itemId: 21182, itemName: "Band of Earthen Might" },
      { itemId: 21393, itemName: "Signet of Unyielding Strength" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" }
    ],
    12: [
      { itemId: 23038, itemName: "Band of Unnatural Forces" },
      { itemId: 18821, itemName: "Quick Strike Ring" },
      { itemId: 21677, itemName: "Ring of the Qiraji Fury" },
      { itemId: 19432, itemName: "Circle of Applied Force" },
      { itemId: 19384, itemName: "Master Dragonslayer's Ring" },
      { itemId: 19325, itemName: "Don Julio's Band" },
      { itemId: 21182, itemName: "Band of Earthen Might" },
      { itemId: 21393, itemName: "Signet of Unyielding Strength" },
      { itemId: 21205, itemName: "Signet Ring of the Bronze Dragonflight" },
      { itemId: 17063, itemName: "Band of Accuria" }
    ],
    13: [
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 20130, itemName: "Diamond Flask" },
      { itemId: 23570, itemName: "Jom Gabbar" },
      { itemId: 21180, itemName: "Earthstrike" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 11815, itemName: "Hand of Justice" },
      { itemId: 21670, itemName: "Badge of the Swarmguard" },
      { itemId: 21647, itemName: "Fetish of the Sand Reaver" }
    ],
    14: [
      { itemId: 22954, itemName: "Kiss of the Spider" },
      { itemId: 23206, itemName: "Mark of the Champion" },
      { itemId: 23041, itemName: "Slayer's Crest" },
      { itemId: 20130, itemName: "Diamond Flask" },
      { itemId: 23570, itemName: "Jom Gabbar" },
      { itemId: 21180, itemName: "Earthstrike" },
      { itemId: 19406, itemName: "Drake Fang Talisman" },
      { itemId: 11815, itemName: "Hand of Justice" },
      { itemId: 21670, itemName: "Badge of the Swarmguard" },
      { itemId: 21647, itemName: "Fetish of the Sand Reaver" }
    ],
    15: [
      { itemId: 23045, itemName: "Shroud of Dominion" },
      { itemId: 21710, itemName: "Cloak of the Fallen God" },
      { itemId: 19436, itemName: "Cloak of Draconic Might" },
      { itemId: 21701, itemName: "Cloak of Concentrated Hatred" },
      { itemId: 21394, itemName: "Drape of Unyielding Strength" },
      { itemId: 18541, itemName: "Puissant Cape" }
    ],
    16: [
      { itemId: 23054, itemName: "Gressil, Dawn of Ruin" },
      { itemId: 23577, itemName: "The Hungering Cold" },
      { itemId: 22808, itemName: "The Castigator" },
      { itemId: 17112, itemName: "Empyrean Demolisher" },
      { itemId: 23221, itemName: "Misplaced Servo Arm" },
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 12584, itemName: "Grand Marshal's Longsword" },
      { itemId: 19352, itemName: "Chromatically Tempered Sword" },
      { itemId: 21650, itemName: "Ancient Qiraji Ripper" },
      { itemId: 22816, itemName: "Hatchet of Sundered Bone" },
      { itemId: 18828, itemName: "High Warlord's Cleaver" },
      { itemId: 21242, itemName: "Blessed Qiraji War Axe" },
      { itemId: 19363, itemName: "Crul'shorukh, Edge of Chaos" },
      { itemId: 17068, itemName: "Deathbringer" }
    ],
    17: [
      { itemId: 23577, itemName: "The Hungering Cold" },
      { itemId: 22808, itemName: "The Castigator" },
      { itemId: 23014, itemName: "Iblis, Blade of the Fallen Seraph" },
      { itemId: 23456, itemName: "Grand Marshal's Swiftblade" },
      { itemId: 19352, itemName: "Chromatically Tempered Sword" },
      { itemId: 19351, itemName: "Maladath, Runed Blade of the Black Flight" },
      { itemId: 23221, itemName: "Misplaced Servo Arm" },
      { itemId: 21837, itemName: "Anubisath Warhammer" },
      { itemId: 21650, itemName: "Ancient Qiraji Ripper" },
      { itemId: 18832, itemName: "Brutality Blade" },
      { itemId: 18828, itemName: "High Warlord's Cleaver" },
      { itemId: 19363, itemName: "Crul'shorukh, Edge of Chaos" },
      { itemId: 21242, itemName: "Blessed Qiraji War Axe" },
      { itemId: 19362, itemName: "Doom's Edge" },
      { itemId: 19921, itemName: "Zulian Hacker" },
      { itemId: 21392, itemName: "Sickle of Unyielding Strength" }
    ],
    18: [
      { itemId: 22812, itemName: "Nerubian Slavemaker" },
      { itemId: 22811, itemName: "Soulstring" },
      { itemId: 23557, itemName: "Larvae of the Great Worm" },
      { itemId: 21459, itemName: "Crossbow of Imminent Doom" },
      { itemId: 17069, itemName: "Striker's Mark" },
      { itemId: 19853, itemName: "Gurubashi Dwarf Destroyer" },
      { itemId: 19107, itemName: "Bloodseeker" },
      { itemId: 17072, itemName: "Blastershot Launcher" },
      { itemId: 22656, itemName: "The Purifier" }
    ]
  }
};

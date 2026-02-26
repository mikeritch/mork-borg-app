const STORAGE_KEY = "morkborg-reliquary.characters.v1";
const ACTIVE_KEY = "morkborg-reliquary.active.v1";
const THEME_KEY = "morkborg-reliquary.theme.v1";
const CUSTOM_OPTION_VALUE = "__custom__";
const POWER_TRACKER_LENGTH = 12;
const KNOWN_POWERS_MAX = 99;
const DICE_MODULE_GLOBAL = "MorkBorgDice";
const DICE_MODULE_SCRIPT_ID = "mb-dice-module-script";
const DICE_MODULE_SCRIPT_SRC = "dice.js?v=20260226-local-dice-modules-fix1";

const FIELD_IDS = [
  "name",
  "epithet",
  "className",
  "homeland",
  "age",
  "level",
  "strength",
  "agility",
  "presence",
  "toughness",
  "hpCurrent",
  "hpMax",
  "omens",
  "silver",
  "attack",
  "weaponCustomName",
  "weaponCustomDie",
  "armorCustomName",
  "armorCustomDie",
  "powersKnownCount",
  "powersCastToday",
  "sacredScrolls",
  "uncleanScrolls",
  "powersKnown",
  "powersNotes",
  "powersKnownMarks",
  "powersCastMarks",
  "scars",
  "weapon",
  "armor",
  "trinket",
  "inventory",
  "notes",
];

const NUMERIC_FIELDS = new Set([
  "level",
  "strength",
  "agility",
  "presence",
  "toughness",
  "hpCurrent",
  "hpMax",
  "omens",
  "silver",
  "weaponCustomDie",
  "armorCustomDie",
  "powersKnownCount",
  "powersCastToday",
  "sacredScrolls",
  "uncleanScrolls",
]);

const DEFAULTS = {
  name: "",
  epithet: "",
  className: "Classless Scvm",
  homeland: "",
  age: "",
  level: 1,
  strength: 0,
  agility: 0,
  presence: 0,
  toughness: 0,
  hpCurrent: 1,
  hpMax: 1,
  omens: 1,
  silver: 20,
  attack: "Strength",
  damage: "d6",
  armorTier: 0,
  weaponCustomName: "",
  weaponCustomDie: 6,
  armorCustomName: "",
  armorCustomDie: 2,
  powersKnownCount: 0,
  powersCastToday: 0,
  sacredScrolls: 0,
  uncleanScrolls: 0,
  powersKnown: "",
  powersNotes: "",
  powersKnownMarks: "",
  powersCastMarks: "",
  weaponLabel: "",
  armorLabel: "",
  scars: "",
  weapon: "",
  armor: "",
  trinket: "",
  inventory: "",
  notes: "",
};

const WEAPON_DATA = {
  "Unarmed (d2)": { damage: "d2", attack: "Strength" },
  "Femur (d4)": { damage: "d4", attack: "Strength" },
  "Staff (d4)": { damage: "d4", attack: "Strength" },
  "Shortsword (d4)": { damage: "d4", attack: "Strength" },
  "Knife (d4)": { damage: "d4", attack: "Strength" },
  "Warhammer (d6)": { damage: "d6", attack: "Strength" },
  "Sword (d6)": { damage: "d6", attack: "Strength" },
  "Bow (d6, Presence + 10 arrows)": { damage: "d6", attack: "Presence" },
  "Flail (d8)": { damage: "d8", attack: "Strength" },
  "Crossbow (d8, Presence + 10 bolts)": { damage: "d8", attack: "Presence" },
  "Zweihander (d10)": { damage: "d10", attack: "Strength" },
};

const ARMOR_DATA = {
  "No armor": { tier: 0, reductionDie: 0 },
  "Light armor (-d2 damage)": { tier: 1, reductionDie: 2 },
  "Medium armor (-d4 damage, DR +2 Agility tests)": { tier: 2, reductionDie: 4 },
  "Heavy armor (-d6 damage, DR +4 Agility tests)": { tier: 3, reductionDie: 6 },
  "Shield (-1 damage or break to ignore one attack)": { tier: 0, reductionDie: 1 },
};

const WEAPON_CHOICES = new Set(["", CUSTOM_OPTION_VALUE, ...Object.keys(WEAPON_DATA)]);
const ARMOR_CHOICES = new Set(["", CUSTOM_OPTION_VALUE, ...Object.keys(ARMOR_DATA)]);

const generators = {
  namesA: [
    "Aerg-Tval",
    "Agn",
    "Arvant",
    "Belsum",
    "Belum",
    "Brint",
    "Borda",
    "Daeru",
    "Eldar",
    "Felban",
    "Gotven",
    "Graft",
    "Grin",
    "Grittr",
    "Haeru",
    "Hargha",
    "Harmug",
    "Jotna",
    "Karg",
    "Karva",
    "Katla",
    "Keftar",
    "Klort",
    "Kratar",
    "Kutz",
    "Kvetin",
    "Lygan",
    "Margar",
    "Merkari",
    "Nagl",
    "Niduk",
    "Nifehl",
    "Prugl",
    "Qillnach",
    "Risten",
    "Svind",
    "Theras",
    "Therg",
    "Torvul",
    "Torn",
    "Urm",
    "Urvarg",
    "Vagal",
    "Vatan",
    "Von",
    "Vrakh",
    "Vresi",
    "Wemut",
    "Aldur",
    "Ysold",
    "Mirek",
    "Silas",
    "Tova",
    "Drogo",
    "Ravik",
    "Kelda",
  ],
  namesB: [
    "Ashborn",
    "Blacktongue",
    "Bleakvein",
    "Bonewake",
    "Brine-Crown",
    "Carrion",
    "Corpsebane",
    "Crowhand",
    "Dreadwake",
    "Frostspine",
    "Gallows",
    "Gloamchild",
    "Graveshade",
    "Grimveil",
    "Hallow",
    "Harrow",
    "Holloweye",
    "Ironmold",
    "Mireclaw",
    "Morrow",
    "Nightmire",
    "Palegrin",
    "Rimeblood",
    "Rottooth",
    "Ruin-Bell",
    "Sable",
    "Skullmarrow",
    "Slagborn",
    "Thorn",
    "Tombsalt",
    "Vilewater",
    "Woe",
    "Wormsigil",
    "Wraithmark",
    "Doomthread",
    "Galldust",
    "Rotspark",
    "Charnel",
    "Crow-Mire",
    "Bog-Saint",
  ],
  epithets: [
    "Bearer of Rotten Light",
    "Saint of Ruined Bells",
    "Sworn to the Last Dusk",
    "Pilgrim of the Burning Mire",
    "Keeper of Splintered Teeth",
    "Witness to the Black Sun",
    "Vagrant of Broken Relics",
    "Herald of the Pale Feast",
    "Ash-Crowned Graverobber",
    "Bell-Toll Penitent",
    "Maggot-Fed Prophet",
    "Candleless Pilgrim",
    "Sepulcher Witness",
    "Scourge of the Mire",
  ],
  classes: [
    "Classless Scvm",
    "Fanged Deserter",
    "Gutterborn Scum",
    "Esoteric Hermit",
    "Wretched Royalty",
    "Heretical Priest",
    "Occult Herbmaster",
    "Pale One",
    "Child of the Swamp",
  ],
  homelands: [
    "Grift",
    "Kerguz",
    "Sarkash",
    "Tveland",
    "Bergen Chrypt",
    "Valley of the Unfortunate Undead",
    "Galgenbeck outskirts",
    "A nameless plague village",
    "An unmarked battlefield",
    "A ruined monastery",
  ],
  classlessLoadD6: [
    "Nothing",
    "Nothing",
    "Backpack (capacity: 7 normal items)",
    "Sack (capacity: 10 normal items)",
    "Small wagon",
    "Donkey (inventory carrier)",
  ],
  classlessGearD12A: [
    "Rope (30ft)",
    "Torches (Presence + 4)",
    "Lantern and oil (Presence + 6 hours)",
    "Magnesium strip (instant bright light)",
    "Random unclean scroll",
    "Sharp needle",
    "Medicine chest (Presence + 4 uses)",
    "Metal file and lockpicks",
    "Bear trap (d8 damage)",
    "Bomb (d10 damage)",
    "Red poison (d4 doses, Toughness DR12 or d10 damage)",
    "Silver crucifix",
  ],
  classlessGearD12B: [
    "Life elixir (d4 doses, heal d6 HP)",
    "Random sacred scroll",
    "Small vicious dog (d6+2 HP, bite d4)",
    "Monkeys (d4)",
    "Exquisite perfume (worth 25s)",
    "Toolbox (nails, tongs, hammer, saw, drill)",
    "Heavy chain (15ft)",
    "Grappling hook",
    "Shield (-1 damage, or break to ignore one attack)",
    "Crowbar (d4 damage)",
    "Lard (5 meals)",
    "Tent",
  ],
  classlessWeapons: [
    { label: "Femur (d4)", damage: "d4", attack: "Strength" },
    { label: "Staff (d4)", damage: "d4", attack: "Strength" },
    { label: "Shortsword (d4)", damage: "d4", attack: "Strength" },
    { label: "Knife (d4)", damage: "d4", attack: "Strength" },
    { label: "Warhammer (d6)", damage: "d6", attack: "Strength" },
    { label: "Sword (d6)", damage: "d6", attack: "Strength" },
    { label: "Bow (d6, Presence + 10 arrows)", damage: "d6", attack: "Presence" },
    { label: "Flail (d8)", damage: "d8", attack: "Strength" },
    { label: "Crossbow (d8, Presence + 10 bolts)", damage: "d8", attack: "Presence" },
    { label: "Zweihander (d10)", damage: "d10", attack: "Strength" },
  ],
  classlessArmor: [
    { label: "No armor", tier: 0 },
    { label: "Light armor (-d2 damage)", tier: 1 },
    { label: "Medium armor (-d4 damage, DR +2 Agility tests)", tier: 2 },
    { label: "Heavy armor (-d6 damage, DR +4 Agility tests)", tier: 3 },
  ],
  trinkets: [
    "A tooth carved with scripture",
    "A key with no known lock",
    "A shard of mirror that shows another face",
    "A bell that rings only underwater",
    "A vial of grave dirt and silver filings",
    "A saint's fingerbone wrapped in linen",
    "A black coin stamped with a blind eye",
    "A prayer strip sewn into skin",
    "A rusted knucklebone reliquary",
    "A tiny iron idol missing its head",
    "A bone die with no pips",
    "A ribbon from a saint's shroud",
  ],
  notes: [
    "Owes a favor to a one-eyed butcher in Galgenbeck.",
    "Dreams nightly of a throne built from bells.",
    "Believes they carry a prophecy carved into their scars.",
    "Will never enter a church again after the winter purge.",
    "Hunts the apostate who burned their kin.",
    "Claims to hear the sea inside sealed tombs.",
    "Has sworn to never refuse a grave-digger's request.",
    "Keeps a tally of each night survived in charcoal marks.",
    "Carries guilt for abandoning a sibling during the plague.",
  ],
  scars: [
    "Acid pitting",
    "Ritual brand",
    "Half-healed bite",
    "Old battlefield cut",
    "Burned palm sigil",
    "Broken nose set wrong",
    "Clouded eye",
    "Missing fingertip",
  ],
};

const state = {
  characters: [],
  activeId: null,
  saveTimer: null,
  diceTray: null,
  diceLoadPromise: null,
  diceInitPromise: null,
  hpMaxHintVisible: false,
};

const els = {
  form: document.getElementById("character-form"),
  characterList: document.getElementById("character-list"),
  listEmpty: document.getElementById("list-empty"),
  listTemplate: document.getElementById("character-item-template"),
  sheetTitle: document.getElementById("sheet-title"),
  status: document.getElementById("status"),
  newCharacter: document.getElementById("new-character"),
  randomCharacter: document.getElementById("random-character"),
  themeToggle: document.getElementById("theme-toggle"),
  saveCharacter: document.getElementById("save-character"),
  deleteCharacter: document.getElementById("delete-character"),
  exportCharacter: document.getElementById("export-character"),
  importCharacter: document.getElementById("import-character"),
  importFile: document.getElementById("import-file"),
  weaponCustomNameWrap: document.getElementById("weapon-custom-name-wrap"),
  weaponCustomDieWrap: document.getElementById("weapon-custom-die-wrap"),
  armorCustomNameWrap: document.getElementById("armor-custom-name-wrap"),
  armorCustomDieWrap: document.getElementById("armor-custom-die-wrap"),
  hpCurrentCard: document.getElementById("hp-current-card"),
  hpCurrentCounter: document.getElementById("hp-current-counter"),
  hpCurrentDisplay: document.getElementById("hp-current-display"),
  hpCurrentValue: document.getElementById("hp-current-value"),
  hpCurrentSkull: document.getElementById("hp-current-skull"),
  hpCurrentHint: document.getElementById("hp-current-hint"),
  powersCastCard: document.getElementById("powers-cast-card"),
  powersKnownCounter: document.getElementById("powers-known-counter"),
  powersCastCounter: document.getElementById("powers-cast-counter"),
  powersCastDisplay: document.getElementById("powers-cast-display"),
  knownPowersList: document.getElementById("known-powers-list"),
  addKnownPower: document.getElementById("add-known-power"),
  dicePanel: document.getElementById("dice-panel"),
  dicePanelDesktopSlot: document.getElementById("dice-panel-desktop-slot"),
  diceToggle: document.getElementById("dice-toggle"),
  dicePanelBody: document.getElementById("dice-panel-body"),
  dicePreviewHost: document.getElementById("dice-preview-host"),
  dicePreviewCanvas: document.getElementById("dice-preview-canvas"),
  diceCanvas: document.getElementById("dice-canvas"),
  diceOverlay: document.getElementById("dice-viewport-overlay"),
  diceFallback: document.getElementById("dice-fallback"),
  diceRollBtn: document.getElementById("dice-roll-btn"),
  diceClearBtn: document.getElementById("dice-clear-btn"),
  diceHistory: document.getElementById("dice-history"),
  dicePurgeBtn: document.getElementById("dice-purge-btn"),
  diceAdvanced: document.getElementById("dice-advanced"),
  diceForce2d: document.getElementById("dice-force-2d"),
  diceLowPerformance: document.getElementById("dice-low-performance"),
  diceStatus: document.getElementById("dice-status"),
  footerYear: document.getElementById("footer-year"),
  fields: Object.fromEntries(FIELD_IDS.map((id) => [id, document.getElementById(id)])),
};

function setInlineDiceStatus(message, tone = "neutral") {
  if (!els.diceStatus) {
    return;
  }
  els.diceStatus.textContent = message;
  els.diceStatus.dataset.tone = tone;
}

function diceControllerParams() {
  return {
    setGlobalStatus: setStatus,
    panel: els.dicePanel,
    toggle: els.diceToggle,
    body: els.dicePanelBody,
    previewHost: els.dicePreviewHost,
    previewCanvas: els.dicePreviewCanvas,
    rollButton: els.diceRollBtn,
    clearButton: els.diceClearBtn,
    history: els.diceHistory,
    purgeButton: els.dicePurgeBtn,
    advanced: els.diceAdvanced,
    force2d: els.diceForce2d,
    lowPerformance: els.diceLowPerformance,
    canvas: els.diceCanvas,
    overlay: els.diceOverlay,
    fallback: els.diceFallback,
    status: els.diceStatus,
    root: els.dicePanel,
  };
}

function placeDicePanelByViewport() {
  if (!els.dicePanel || !els.dicePanelDesktopSlot) {
    return;
  }
  const targetSlot = els.dicePanelDesktopSlot;
  if (els.dicePanel.parentElement !== targetSlot) {
    targetSlot.appendChild(els.dicePanel);
  }
}

function getDiceFactory() {
  const moduleRef = window[DICE_MODULE_GLOBAL];
  if (
    moduleRef &&
    typeof moduleRef === "object" &&
    typeof moduleRef.createDiceTrayController === "function"
  ) {
    return moduleRef.createDiceTrayController;
  }
  return null;
}

function loadDiceModuleScript() {
  const existingFactory = getDiceFactory();
  if (existingFactory) {
    return Promise.resolve(existingFactory);
  }
  if (state.diceLoadPromise) {
    return state.diceLoadPromise;
  }

  state.diceLoadPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(DICE_MODULE_SCRIPT_ID);

    const handleLoad = () => {
      script?.setAttribute("data-loaded", "true");
      const factory = getDiceFactory();
      if (!factory) {
        script?.setAttribute("data-error", "true");
        reject(new Error("Dice module loaded, but controller factory was missing."));
        return;
      }
      resolve(factory);
    };

    const handleError = () => {
      script?.setAttribute("data-error", "true");
      reject(new Error("Failed to load dice module script."));
    };

    if (!script) {
      script = document.createElement("script");
      script.id = DICE_MODULE_SCRIPT_ID;
      script.src = DICE_MODULE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
      return;
    }

    if (script.getAttribute("data-loaded") === "true") {
      handleLoad();
      return;
    }
    if (script.getAttribute("data-error") === "true") {
      script.remove();
      script = document.createElement("script");
      script.id = DICE_MODULE_SCRIPT_ID;
      script.src = DICE_MODULE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
      return;
    }
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error) => {
    state.diceLoadPromise = null;
    throw error;
  });

  return state.diceLoadPromise;
}

async function ensureDiceTrayInitialized() {
  if (state.diceTray) {
    return true;
  }
  if (state.diceInitPromise) {
    return state.diceInitPromise;
  }
  if (!els.dicePanel || !els.diceToggle) {
    return false;
  }

  state.diceInitPromise = (async () => {
    setInlineDiceStatus("Loading dice tray...", "neutral");
    if (els.diceRollBtn) {
      els.diceRollBtn.disabled = true;
    }

    try {
      const createDiceTrayController = await loadDiceModuleScript();
      state.diceTray = createDiceTrayController(diceControllerParams());
      state.diceTray.init();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown dice load error.";
      setInlineDiceStatus(`Dice tray unavailable. ${message}`, "error");
      setStatus(`Dice tray failed to load: ${message}`, "error");
      return false;
    } finally {
      if (els.diceRollBtn) {
        els.diceRollBtn.disabled = false;
      }
    }
  })().finally(() => {
    state.diceInitPromise = null;
  });

  return state.diceInitPromise;
}

function bindDiceLazyLoading() {
  if (!els.diceToggle && !els.diceRollBtn) {
    return;
  }
  let replayInProgress = false;

  const lazyInitHandler = async (event) => {
    if (state.diceTray || replayInProgress) {
      return;
    }
    if (state.diceInitPromise) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const trigger = event.currentTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const ready = await ensureDiceTrayInitialized();
    if (!ready) {
      return;
    }

    replayInProgress = true;
    trigger.click();
    replayInProgress = false;
  };

  if (els.diceToggle) {
    els.diceToggle.addEventListener("click", lazyInitHandler);
  }
  if (els.diceRollBtn) {
    els.diceRollBtn.addEventListener("click", lazyInitHandler);
  }
}

function ensureThemeToggleButton() {
  const brandCopy = document.querySelector(".brand-copy");
  if (!brandCopy) {
    return;
  }

  const brandSub = brandCopy.querySelector(".brand-sub");
  let quickActions = brandCopy.querySelector(".brand-quick-actions");
  if (!quickActions) {
    quickActions = document.createElement("div");
    quickActions.className = "brand-quick-actions";
    if (brandSub && brandSub.parentElement === brandCopy) {
      brandCopy.insertBefore(quickActions, brandSub.nextElementSibling);
    } else {
      brandCopy.appendChild(quickActions);
    }
  }

  const button = els.themeToggle || document.createElement("button");
  button.id = "theme-toggle";
  button.className = "btn btn-ghost theme-toggle brand-theme-toggle";
  button.type = "button";
  button.setAttribute("aria-pressed", "true");
  button.setAttribute("aria-label", "Switch theme");
  button.title = "Switch theme";
  if (!button.textContent.trim()) {
    button.textContent = "Sinner";
  }
  if (button.parentElement !== quickActions) {
    quickActions.insertBefore(button, quickActions.firstChild);
  } else if (quickActions.firstElementChild !== button) {
    quickActions.insertBefore(button, quickActions.firstChild);
  }
  els.themeToggle = button;
}

function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function resolveTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch (_error) {
    // Ignore storage access issues and keep default theme.
  }
  return currentTheme();
}

function applyTheme(theme, persist = false) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;

  if (els.themeToggle) {
    const darkOn = next === "dark";
    els.themeToggle.textContent = darkOn ? "Sinner" : "Saint";
    els.themeToggle.setAttribute("aria-pressed", String(darkOn));
    const targetLabel = darkOn ? "Switch to Saint mode" : "Switch to Sinner mode";
    els.themeToggle.setAttribute("aria-label", targetLabel);
    els.themeToggle.title = targetLabel;
  }

  if (!persist) {
    return;
  }
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_error) {
    // Ignore storage access issues and keep theme in-memory.
  }
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next, true);
  setStatus(next === "dark" ? "Dark mode stirs." : "Light mode kindled.", "ok");
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rollDice(count, sides) {
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createBlankCharacter() {
  const timestamp = nowIso();
  return {
    id: uid(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...DEFAULTS,
  };
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dieText(sides) {
  return `d${sides}`;
}

function parseDieFromText(text) {
  const match = String(text || "").match(/d(\d+)/i);
  return match ? Number(match[1]) : null;
}

function parseArmorReductionDie(text) {
  const match = String(text || "").match(/-d(\d+)/i);
  return match ? Number(match[1]) : null;
}

function clampCustomDie(value, fallback) {
  return clamp(Math.trunc(toSafeNumber(value, fallback)), 2, 20);
}

function normalizePowerMarks(marks) {
  const clean = String(marks ?? "").replace(/[^01]/g, "");
  return clean.slice(0, POWER_TRACKER_LENGTH).padEnd(POWER_TRACKER_LENGTH, "0");
}

function countMarked(marks) {
  return marks.split("").reduce((total, mark) => total + (mark === "1" ? 1 : 0), 0);
}

function parseKnownPowersText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function fallbackKnownPowersFromCount(count) {
  const safe = clamp(Math.trunc(toSafeNumber(count, 0)), 0, KNOWN_POWERS_MAX);
  return Array.from({ length: safe }, (_unused, index) => `Power ${index + 1}`);
}

function buildKnownPowerRow(value = "") {
  const row = document.createElement("div");
  row.className = "known-power-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "known-power-input";
  input.placeholder = "Power name";
  input.maxLength = 120;
  input.value = value;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "known-power-remove";
  remove.setAttribute("data-known-power-remove", "1");
  remove.setAttribute("aria-label", "Remove known power");
  remove.title = "Remove known power";
  remove.textContent = "×";

  row.appendChild(input);
  row.appendChild(remove);
  return row;
}

function collectKnownPowersFromList() {
  if (!els.knownPowersList) {
    return parseKnownPowersText(els.fields.powersKnown?.value);
  }
  return Array.from(els.knownPowersList.querySelectorAll(".known-power-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function syncKnownPowersFromUI() {
  const powers = collectKnownPowersFromList();
  if (els.fields.powersKnown) {
    els.fields.powersKnown.value = powers.join("\n");
  }
  setPowerTrackerValue("known", powers.length);
}

function renderKnownPowersList(character) {
  if (!els.knownPowersList) {
    return;
  }
  const explicit = parseKnownPowersText(character?.powersKnown);
  const legacyCount = clamp(Math.trunc(toSafeNumber(character?.powersKnownCount, 0)), 0, KNOWN_POWERS_MAX);
  const values = explicit.length > 0 ? explicit : fallbackKnownPowersFromCount(legacyCount);
  els.knownPowersList.innerHTML = "";
  const initial = values.length > 0 ? values : [""];
  initial.forEach((value) => {
    els.knownPowersList.appendChild(buildKnownPowerRow(value));
  });
  syncKnownPowersFromUI();
}

function addKnownPowerRow(value = "", shouldFocus = true) {
  if (!els.knownPowersList) {
    return;
  }
  const row = buildKnownPowerRow(value);
  els.knownPowersList.appendChild(row);
  if (shouldFocus) {
    const input = row.querySelector(".known-power-input");
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
  }
}

function powerMarksFromCount(count) {
  const safe = clamp(Math.trunc(toSafeNumber(count, 0)), 0, POWER_TRACKER_LENGTH);
  return `${"1".repeat(safe)}${"0".repeat(POWER_TRACKER_LENGTH - safe)}`;
}

function trackerDescriptor(target) {
  switch (target) {
    case "known":
      return {
        label: "known powers",
        fieldId: "powersKnownCount",
        marksFieldId: null,
        max: KNOWN_POWERS_MAX,
        showMax: false,
        counter: els.powersKnownCounter,
      };
    case "cast":
      return {
        label: "cast attempts",
        fieldId: "powersCastToday",
        marksFieldId: null,
        max: null,
        showMax: false,
        card: els.powersCastCard,
        display: els.powersCastDisplay,
        counter: els.powersCastCounter,
      };
    default:
      return null;
  }
}

function retriggerAnimation(element, className) {
  if (!element) {
    return;
  }
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  let cleared = false;
  const clear = () => {
    if (cleared) {
      return;
    }
    cleared = true;
    element.classList.remove(className);
    element.removeEventListener("animationend", clear);
  };
  element.addEventListener("animationend", clear);
  window.setTimeout(clear, 760);
}

function spawnMagicSparks(container) {
  if (!container) {
    return;
  }
  for (let index = 0; index < 7; index += 1) {
    const spark = document.createElement("span");
    spark.className = "power-spark";
    spark.style.setProperty("--dx", `${Math.round((Math.random() - 0.5) * 120)}px`);
    spark.style.setProperty("--dy", `${Math.round((Math.random() - 0.5) * 90 - 18)}px`);
    spark.style.setProperty("--delay", `${Math.round(Math.random() * 90)}ms`);
    container.appendChild(spark);
    window.setTimeout(() => spark.remove(), 760);
  }
}

function clearCastTrackerEffects(tracker) {
  if (!tracker || tracker.fieldId !== "powersCastToday") {
    return;
  }
  tracker.card?.classList.remove("is-bloodied", "is-magic-burst", "is-shaking");
  tracker.display?.classList.remove("is-bloodied", "is-rising");
}

function applyPowerTrackerSkin(target, count) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return;
  }
  if (target === "cast") {
    clearCastTrackerEffects(tracker);
    return;
  }
  const isBloodied = count > 3;
  tracker.card?.classList.toggle("is-bloodied", isBloodied);
  tracker.display?.classList.toggle("is-bloodied", isBloodied);
}

function getTrackerCount(target) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return 0;
  }
  const source = els.fields[tracker.fieldId];
  const value = Math.max(0, Math.trunc(toSafeNumber(source?.value, 0)));
  if (typeof tracker.max === "number") {
    return clamp(value, 0, tracker.max);
  }
  return value;
}

function setPowerTrackerValue(target, count) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return 0;
  }
  const raw = Math.max(0, Math.trunc(toSafeNumber(count, 0)));
  const safe = typeof tracker.max === "number" ? clamp(raw, 0, tracker.max) : raw;
  const maxLabel = typeof tracker.max === "number" ? tracker.max : null;

  if (els.fields[tracker.fieldId]) {
    els.fields[tracker.fieldId].value = String(safe);
  }
  if (tracker.marksFieldId && els.fields[tracker.marksFieldId]) {
    const marks = powerMarksFromCount(safe);
    els.fields[tracker.marksFieldId].value = marks;
  }
  if (tracker.display) {
    tracker.display.textContent = String(safe);
  }
  if (tracker.counter) {
    tracker.counter.textContent = tracker.showMax && maxLabel !== null ? `${safe} / ${maxLabel}` : String(safe);
  }
  applyPowerTrackerSkin(target, safe);
  return safe;
}

function syncCurrentHpTracker() {
  const hpMax = clamp(Math.trunc(toSafeNumber(els.fields.hpMax?.value, DEFAULTS.hpMax)), 1, 30);
  const hpCurrent = clamp(
    Math.trunc(toSafeNumber(els.fields.hpCurrent?.value, DEFAULTS.hpCurrent)),
    0,
    hpMax
  );
  const healthRatio = hpMax > 0 ? hpCurrent / hpMax : 1;
  const isBloodied = healthRatio < 0.2;
  const isBroken = hpCurrent === 0;

  if (els.fields.hpMax) {
    els.fields.hpMax.value = String(hpMax);
  }
  if (els.fields.hpCurrent) {
    els.fields.hpCurrent.value = String(hpCurrent);
  }
  if (els.hpCurrentValue) {
    els.hpCurrentValue.textContent = String(hpCurrent);
  } else if (els.hpCurrentDisplay) {
    els.hpCurrentDisplay.textContent = String(hpCurrent);
  }
  if (els.hpCurrentCounter) {
    els.hpCurrentCounter.textContent = `${hpCurrent} / ${hpMax}`;
  }
  if (els.hpCurrentCard) {
    els.hpCurrentCard.classList.toggle("is-bloodied", isBloodied);
  }
  if (els.hpCurrentDisplay) {
    els.hpCurrentDisplay.classList.toggle("is-bloodied", isBloodied);
  }
  if (els.hpCurrentSkull) {
    els.hpCurrentSkull.hidden = !isBroken;
  }
  if (els.hpCurrentHint) {
    if (isBroken) {
      els.hpCurrentHint.hidden = false;
      els.hpCurrentHint.textContent = "BROKEN";
      els.hpCurrentHint.classList.add("is-broken");
      state.hpMaxHintVisible = false;
    } else if (state.hpMaxHintVisible) {
      els.hpCurrentHint.hidden = false;
      els.hpCurrentHint.textContent = "Current HP cannot exceed Max HP.";
      els.hpCurrentHint.classList.remove("is-broken");
    } else {
      els.hpCurrentHint.hidden = true;
      els.hpCurrentHint.classList.remove("is-broken");
    }
  }

  return { hpCurrent, hpMax };
}

function adjustCurrentHp(delta) {
  const { hpCurrent, hpMax } = syncCurrentHpTracker();
  const next = clamp(hpCurrent + delta, 0, hpMax);
  if (next === hpCurrent) {
    if (delta > 0 && hpCurrent >= hpMax) {
      state.hpMaxHintVisible = true;
      syncCurrentHpTracker();
      setStatus("Hit points are already at max.", "warn");
      return;
    }
    state.hpMaxHintVisible = false;
    syncCurrentHpTracker();
    setStatus("Hit points are already at 0.", "warn");
    return;
  }

  state.hpMaxHintVisible = false;
  if (els.fields.hpCurrent) {
    els.fields.hpCurrent.value = String(next);
  }
  syncCurrentHpTracker();
  if (delta > 0) {
    retriggerAnimation(els.hpCurrentDisplay, "is-rising");
  } else {
    retriggerAnimation(els.hpCurrentCard, "is-shaking");
  }
  setStatus(`Current HP: ${next}/${hpMax}.`, "ok");
}

function trackerCountFromCharacter(character, target) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return 0;
  }

  if (target === "known") {
    const fromList = parseKnownPowersText(character?.powersKnown).length;
    if (fromList > 0) {
      return typeof tracker.max === "number" ? clamp(fromList, 0, tracker.max) : Math.max(0, fromList);
    }
  }

  if (target === "cast") {
    const hasStoredValue = String(character?.powersCastToday ?? "").trim() !== "";
    if (hasStoredValue) {
      return Math.max(0, Math.trunc(toSafeNumber(character.powersCastToday, 0)));
    }
    const hasStoredMarks = String(character?.powersCastMarks ?? "").trim() !== "";
    if (hasStoredMarks) {
      return countMarked(normalizePowerMarks(character.powersCastMarks));
    }
    return 0;
  }

  const hasStoredMarks = tracker.marksFieldId
    ? String(character[tracker.marksFieldId] ?? "").trim() !== ""
    : false;
  if (tracker.marksFieldId && hasStoredMarks) {
    return countMarked(normalizePowerMarks(character[tracker.marksFieldId]));
  }
  const value = Math.max(0, Math.trunc(toSafeNumber(character[tracker.fieldId], 0)));
  return typeof tracker.max === "number" ? clamp(value, 0, tracker.max) : value;
}

function syncPowerTrackersFromCharacter(character) {
  renderKnownPowersList(character);
  setPowerTrackerValue("cast", trackerCountFromCharacter(character, "cast"));
}

function syncPowerTrackersFromUI() {
  syncKnownPowersFromUI();
  setPowerTrackerValue("cast", getTrackerCount("cast"));
}

function adjustPowerTracker(target, delta) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return;
  }
  const current = getTrackerCount(target);
  const boundedNext = Math.max(0, current + delta);
  const next = typeof tracker.max === "number" ? clamp(boundedNext, 0, tracker.max) : boundedNext;
  setPowerTrackerValue(target, next);

  if (target === "cast") {
    clearCastTrackerEffects(tracker);
    if (delta > 0 && next > current) {
      spawnMagicSparks(tracker.card);
    }
  } else if (delta > 0 && next > current) {
    retriggerAnimation(tracker.card, "is-magic-burst");
    retriggerAnimation(tracker.display, "is-rising");
    spawnMagicSparks(tracker.card);
  } else if (delta < 0) {
    retriggerAnimation(tracker.card, "is-shaking");
  }

  if (next === current) {
    if (delta > 0) {
      setStatus(`Maximum ${tracker.label} reached.`, "warn");
    } else {
      setStatus(`No ${tracker.label} left to reduce.`, "warn");
    }
    return;
  }

  setStatus(
    target === "known" ? `Known powers: ${next}/${KNOWN_POWERS_MAX}.` : `Cast attempts: ${next}.`,
    "ok"
  );
}

function stripTrailingParens(text) {
  return String(text || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function normalizeLegacyWeapon(character) {
  if (WEAPON_CHOICES.has(character.weapon)) {
    return;
  }
  if (!character.weapon) {
    return;
  }
  const fallbackDie = parseDieFromText(character.damage) || DEFAULTS.weaponCustomDie;
  character.weaponCustomName = stripTrailingParens(character.weapon) || "Custom weapon";
  character.weaponCustomDie = clampCustomDie(
    parseDieFromText(character.weapon) || character.weaponCustomDie,
    fallbackDie
  );
  character.weapon = CUSTOM_OPTION_VALUE;
}

function normalizeLegacyArmor(character) {
  if (ARMOR_CHOICES.has(character.armor)) {
    return;
  }
  if (!character.armor) {
    return;
  }
  const tierDerivedDie =
    character.armorTier === 1 ? 2 : character.armorTier === 2 ? 4 : character.armorTier >= 3 ? 6 : 2;
  character.armorCustomName = stripTrailingParens(character.armor) || "Custom armor";
  character.armorCustomDie = clampCustomDie(
    parseArmorReductionDie(character.armor) || character.armorCustomDie,
    tierDerivedDie
  );
  character.armor = CUSTOM_OPTION_VALUE;
}

function resolvedWeapon(character) {
  if (character.weapon === CUSTOM_OPTION_VALUE) {
    const die = clampCustomDie(character.weaponCustomDie, DEFAULTS.weaponCustomDie);
    const name = character.weaponCustomName.trim() || "Custom weapon";
    return {
      label: `${name} (${dieText(die)})`,
      damage: dieText(die),
      attack: character.attack || "Strength",
    };
  }
  const standard = WEAPON_DATA[character.weapon];
  if (standard) {
    return {
      label: character.weapon,
      damage: standard.damage,
      attack: standard.attack,
    };
  }
  return {
    label: character.weapon || "",
    damage: character.damage || "",
    attack: character.attack || "Strength",
  };
}

function resolvedArmor(character) {
  if (character.armor === CUSTOM_OPTION_VALUE) {
    const die = clampCustomDie(character.armorCustomDie, DEFAULTS.armorCustomDie);
    const name = character.armorCustomName.trim() || "Custom armor";
    return {
      label: `${name} (-${dieText(die)} damage)`,
      tier: die <= 2 ? 1 : die <= 4 ? 2 : 3,
      reductionDie: die,
    };
  }
  const standard = ARMOR_DATA[character.armor];
  if (standard) {
    return {
      label: character.armor,
      tier: standard.tier,
      reductionDie: standard.reductionDie,
    };
  }
  return {
    label: character.armor || "",
    tier: 0,
    reductionDie: 0,
  };
}

function applyDerivedEquipment(character) {
  const weapon = resolvedWeapon(character);
  const armor = resolvedArmor(character);
  character.damage = weapon.damage || DEFAULTS.damage;
  character.armorTier = armor.tier;
  character.weaponLabel = weapon.label;
  character.armorLabel = armor.label;
  if (!["Strength", "Presence", "Strength or Presence"].includes(character.attack)) {
    character.attack = weapon.attack || "Strength";
  }
}

function setFieldVisibility(element, isVisible) {
  if (!element) {
    return;
  }
  element.hidden = !isVisible;
  element.classList.toggle("is-hidden", !isVisible);
  element.querySelectorAll("input, select, textarea").forEach((control) => {
    control.disabled = !isVisible;
  });
}

function syncCustomEquipmentFields() {
  const isWeaponCustom = els.fields.weapon.value === CUSTOM_OPTION_VALUE;
  const isArmorCustom = els.fields.armor.value === CUSTOM_OPTION_VALUE;
  setFieldVisibility(els.weaponCustomNameWrap, isWeaponCustom);
  setFieldVisibility(els.weaponCustomDieWrap, isWeaponCustom);
  setFieldVisibility(els.armorCustomNameWrap, isArmorCustom);
  setFieldVisibility(els.armorCustomDieWrap, isArmorCustom);
}

function normalizeCharacter(candidate) {
  const baseline = createBlankCharacter();
  const merged = { ...baseline, ...(candidate || {}) };
  FIELD_IDS.forEach((id) => {
    if (NUMERIC_FIELDS.has(id)) {
      merged[id] = toSafeNumber(merged[id], baseline[id]);
    } else {
      merged[id] = String(merged[id] ?? "");
    }
  });

  merged.level = clamp(Math.trunc(merged.level), 1, 20);
  ["strength", "agility", "presence", "toughness"].forEach((stat) => {
    merged[stat] = clamp(Math.trunc(merged[stat]), -3, 6);
  });
  merged.hpMax = clamp(Math.trunc(merged.hpMax), 1, 30);
  merged.hpCurrent = clamp(Math.trunc(merged.hpCurrent), 0, merged.hpMax);
  merged.omens = clamp(Math.trunc(merged.omens), 0, 9);
  merged.silver = Math.max(0, Math.trunc(merged.silver));
  merged.weaponCustomDie = clampCustomDie(merged.weaponCustomDie, DEFAULTS.weaponCustomDie);
  merged.armorCustomDie = clampCustomDie(merged.armorCustomDie, DEFAULTS.armorCustomDie);
  merged.powersKnownCount = clamp(Math.trunc(merged.powersKnownCount), 0, KNOWN_POWERS_MAX);
  merged.powersCastToday = Math.max(0, Math.trunc(merged.powersCastToday));
  merged.sacredScrolls = clamp(Math.trunc(merged.sacredScrolls), 0, 99);
  merged.uncleanScrolls = clamp(Math.trunc(merged.uncleanScrolls), 0, 99);
  merged.powersKnownMarks = normalizePowerMarks(merged.powersKnownMarks);
  merged.powersCastMarks = normalizePowerMarks(merged.powersCastMarks);
  const hasStoredCastCount = String(candidate?.powersCastToday ?? "").trim() !== "";
  const knownFromList = parseKnownPowersText(merged.powersKnown).length;
  if (knownFromList > 0) {
    merged.powersKnownCount = clamp(knownFromList, 0, KNOWN_POWERS_MAX);
  } else if (candidate && String(candidate.powersKnownMarks ?? "").trim() !== "") {
    merged.powersKnownCount = clamp(countMarked(merged.powersKnownMarks), 0, KNOWN_POWERS_MAX);
  }
  if (!hasStoredCastCount && String(candidate?.powersCastMarks ?? "").trim() !== "") {
    merged.powersCastToday = countMarked(merged.powersCastMarks);
  }
  normalizeLegacyWeapon(merged);
  normalizeLegacyArmor(merged);
  if (!merged.className) {
    merged.className = DEFAULTS.className;
  }
  applyDerivedEquipment(merged);
  merged.id = typeof merged.id === "string" && merged.id ? merged.id : uid();
  merged.createdAt = merged.createdAt || baseline.createdAt;
  merged.updatedAt = merged.updatedAt || baseline.updatedAt;
  return merged;
}

function loadState() {
  let stored = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      stored = parsed.map(normalizeCharacter);
    }
  } catch (error) {
    stored = [];
  }
  state.characters = stored;

  const savedActiveId = localStorage.getItem(ACTIVE_KEY);
  if (state.characters.length === 0) {
    const fresh = createBlankCharacter();
    state.characters = [fresh];
    state.activeId = fresh.id;
    persistState();
    return;
  }

  if (savedActiveId && state.characters.some((sheet) => sheet.id === savedActiveId)) {
    state.activeId = savedActiveId;
    return;
  }

  state.activeId = state.characters[0].id;
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
    if (state.activeId) {
      localStorage.setItem(ACTIVE_KEY, state.activeId);
    }
  } catch (error) {
    setStatus("Storage is unavailable in this browser context.", "error");
  }
}

function activeCharacter() {
  return state.characters.find((sheet) => sheet.id === state.activeId) || null;
}

function updateSheetTitle(character) {
  els.sheetTitle.textContent = character?.name?.trim() || "Unnamed Soul";
}

function applyToForm(character) {
  if (!character) {
    return;
  }
  FIELD_IDS.forEach((id) => {
    const field = els.fields[id];
    const value = character[id] ?? "";
    if (
      field instanceof HTMLSelectElement &&
      value &&
      !Array.from(field.options).some((option) => option.value === value)
    ) {
      const customOption = document.createElement("option");
      customOption.value = value;
      customOption.textContent = `${value} (custom)`;
      field.appendChild(customOption);
    }
    field.value = value;
  });
  syncCustomEquipmentFields();
  state.hpMaxHintVisible = false;
  syncCurrentHpTracker();
  syncPowerTrackersFromCharacter(character);
  updateSheetTitle(character);
}

function pullFromForm(existing) {
  const source = existing ? { ...existing } : createBlankCharacter();
  FIELD_IDS.forEach((id) => {
    const element = els.fields[id];
    if (NUMERIC_FIELDS.has(id)) {
      source[id] = toSafeNumber(element.value, DEFAULTS[id]);
    } else {
      source[id] = element.value.trim();
    }
  });
  return normalizeCharacter(source);
}

function hasCharacterData(character) {
  if (!character) {
    return false;
  }
  return FIELD_IDS.some((id) => {
    const baseline = DEFAULTS[id];
    if (NUMERIC_FIELDS.has(id)) {
      return toSafeNumber(character[id], baseline) !== toSafeNumber(baseline, 0);
    }
    return String(character[id] ?? "").trim() !== String(baseline ?? "").trim();
  });
}

function upsertCharacter(character, notify = true) {
  const idx = state.characters.findIndex((sheet) => sheet.id === character.id);
  if (idx >= 0) {
    state.characters[idx] = character;
  } else {
    state.characters.unshift(character);
  }
  state.activeId = character.id;
  persistState();
  renderCharacterList();
  updateSheetTitle(character);
  if (notify) {
    setStatus("Character sheet stored.", "ok");
  }
}

function saveActiveCharacter(notify = true) {
  const current = activeCharacter() || createBlankCharacter();
  const merged = pullFromForm(current);
  merged.updatedAt = nowIso();
  upsertCharacter(merged, notify);
  return merged;
}

function setActiveCharacter(id) {
  const target = state.characters.find((sheet) => sheet.id === id);
  if (!target) {
    return;
  }
  state.activeId = id;
  persistState();
  renderCharacterList();
  applyToForm(target);
  setStatus("Character sheet loaded.", "ok");
}

function renderCharacterList() {
  els.characterList.innerHTML = "";
  const sorted = [...state.characters].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  sorted.forEach((sheet) => {
    const node = els.listTemplate.content.firstElementChild.cloneNode(true);
    const button = node.querySelector(".character-item");
    const nameEl = node.querySelector(".character-item-name");
    const metaEl = node.querySelector(".character-item-meta");
    const updatedText = new Date(sheet.updatedAt).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    nameEl.textContent = sheet.name || "Unnamed Soul";
    metaEl.textContent = `${sheet.className || "Classless Scvm"} | ${updatedText}`;
    if (sheet.id === state.activeId) {
      button.classList.add("is-active");
    }
    button.addEventListener("click", () => setActiveCharacter(sheet.id));
    els.characterList.appendChild(node);
  });

  els.listEmpty.hidden = state.characters.length > 0;
}

function setStatus(message, tone = "neutral") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function renderFooterYear() {
  if (!els.footerYear) {
    return;
  }
  els.footerYear.textContent = String(new Date().getFullYear());
}

function renderLucideIcons() {
  const lucideApi = window.lucide;
  if (!lucideApi || typeof lucideApi.createIcons !== "function") {
    return;
  }
  lucideApi.createIcons({
    attrs: {
      "stroke-width": "2",
    },
  });
}

function createNewCharacter() {
  const fresh = createBlankCharacter();
  state.characters.unshift(fresh);
  state.activeId = fresh.id;
  persistState();
  renderCharacterList();
  applyToForm(fresh);
  setStatus("New character sheet ready.", "ok");
}

function abilityScoreToModifier(score) {
  if (score <= 4) {
    return -3;
  }
  if (score <= 6) {
    return -2;
  }
  if (score <= 8) {
    return -1;
  }
  if (score <= 12) {
    return 0;
  }
  if (score <= 14) {
    return 1;
  }
  if (score <= 16) {
    return 2;
  }
  return 3;
}

function rollAbilityModifier() {
  return abilityScoreToModifier(rollDice(3, 6));
}

function randomName() {
  if (Math.random() < 0.42) {
    return pick(generators.namesA);
  }
  return `${pick(generators.namesA)} ${pick(generators.namesB)}`;
}

function withPresenceScaling(text, presenceMod) {
  const plusFour = Math.max(1, presenceMod + 4);
  const plusSix = Math.max(1, presenceMod + 6);
  return text
    .replace("Presence + 4", `${plusFour}`)
    .replace("Presence + 6", `${plusSix}`);
}

function rollClasslessWeapon(reducedStart) {
  const table = reducedStart
    ? generators.classlessWeapons.slice(0, 6)
    : generators.classlessWeapons;
  return pick(table);
}

function rollClasslessArmor(reducedStart) {
  const table = reducedStart ? generators.classlessArmor.slice(0, 2) : generators.classlessArmor;
  return pick(table);
}

function randomCharacterPatch() {
  const strength = rollAbilityModifier();
  const agility = rollAbilityModifier();
  const presence = rollAbilityModifier();
  const toughness = rollAbilityModifier();

  const load = pick(generators.classlessLoadD6);
  const gearA = withPresenceScaling(pick(generators.classlessGearD12A), presence);
  const gearB = pick(generators.classlessGearD12B);
  const reducedStart = gearA.toLowerCase().includes("scroll") || gearB.toLowerCase().includes("scroll");

  const weapon = rollClasslessWeapon(reducedStart);
  const armor = rollClasslessArmor(reducedStart);

  const hpMax = Math.max(1, rollDice(1, 8) + toughness);
  const foodDays = rollDice(1, 4);
  const inventoryBits = [
    "Waterskin",
    `${foodDays} day${foodDays === 1 ? "" : "s"} of dry food`,
    load,
    gearA,
    gearB,
  ];

  return {
    name: randomName(),
    epithet: pick(generators.epithets),
    className: "Classless Scvm",
    homeland: pick(generators.homelands),
    age: String(rollDice(2, 10) + 8),
    level: 1,
    strength,
    agility,
    presence,
    toughness,
    hpCurrent: hpMax,
    hpMax,
    omens: rollDice(1, 2),
    silver: rollDice(2, 6) * 10,
    weaponCustomName: "",
    weaponCustomDie: DEFAULTS.weaponCustomDie,
    armorCustomName: "",
    armorCustomDie: DEFAULTS.armorCustomDie,
    powersKnownCount: 0,
    powersCastToday: 0,
    powersKnownMarks: "",
    powersCastMarks: "",
    sacredScrolls: 0,
    uncleanScrolls: 0,
    powersKnown: "",
    powersNotes: "",
    attack: weapon.attack,
    scars: pick(generators.scars),
    weapon: weapon.label,
    armor: armor.label,
    trinket: pick(generators.trinkets),
    inventory: inventoryBits.join(", "),
    notes: `${pick(generators.notes)}${
      reducedStart ? " Started with a scroll, so weapon/armor used reduced classless tables." : ""
    }`,
  };
}

function randomizeActiveCharacter() {
  const existing = activeCharacter() || createBlankCharacter();
  const base = pullFromForm(existing);
  if (hasCharacterData(base)) {
    const label = base.name || "this character";
    const confirmed = window.confirm(
      `Randomize ${label}? This will overwrite the current character details.`
    );
    if (!confirmed) {
      setStatus("Randomize canceled.", "warn");
      return;
    }
  }
  const randomized = normalizeCharacter({
    ...base,
    ...randomCharacterPatch(),
    updatedAt: nowIso(),
  });
  upsertCharacter(randomized, false);
  applyToForm(randomized);
  setStatus("A classless soul is forged from the core tables.", "ok");
}

function deleteActiveCharacter() {
  const current = activeCharacter();
  if (!current) {
    return;
  }
  const label = current.name || "this character";
  const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  state.characters = state.characters.filter((sheet) => sheet.id !== current.id);
  if (state.characters.length === 0) {
    state.characters = [createBlankCharacter()];
  }
  state.activeId = state.characters[0].id;
  persistState();
  renderCharacterList();
  applyToForm(activeCharacter());
  setStatus("Character deleted.", "warn");
}

function exportActiveCharacter() {
  const character = saveActiveCharacter(false);
  const payload = {
    exportedAt: nowIso(),
    characters: [character],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = (character.name || "mork-borg-character")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  anchor.href = url;
  anchor.download = `${safeName || "mork-borg-character"}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setStatus("Character exported to JSON.", "ok");
}

async function importCharacters(file) {
  const rawText = await file.text();
  const parsed = JSON.parse(rawText);
  let incoming = [];

  if (Array.isArray(parsed)) {
    incoming = parsed;
  } else if (parsed && Array.isArray(parsed.characters)) {
    incoming = parsed.characters;
  } else if (parsed && typeof parsed === "object") {
    incoming = [parsed];
  }

  const normalized = incoming.map(normalizeCharacter);
  if (normalized.length === 0) {
    throw new Error("No characters found in file.");
  }

  const byId = new Map(state.characters.map((sheet) => [sheet.id, sheet]));
  const collisions = normalized.filter((sheet) => byId.has(sheet.id));
  if (collisions.length > 0) {
    const preview = collisions
      .slice(0, 3)
      .map((sheet) => byId.get(sheet.id)?.name || sheet.name || "Unnamed Soul")
      .join(", ");
    const suffix = collisions.length > 3 ? ", ..." : "";
    const confirmed = window.confirm(
      `Import will overwrite ${collisions.length} existing character(s): ${preview}${suffix}. Continue?`
    );
    if (!confirmed) {
      setStatus("Import canceled. Existing characters were not overwritten.", "warn");
      return;
    }
  }

  normalized.forEach((sheet) => {
    byId.set(sheet.id, sheet);
  });
  state.characters = Array.from(byId.values());
  state.activeId = normalized[0].id;
  persistState();
  renderCharacterList();
  applyToForm(activeCharacter());
  setStatus(`Imported ${normalized.length} character(s).`, "ok");
}

function scheduleAutoSave() {
  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
  }
  state.saveTimer = window.setTimeout(() => {
    saveActiveCharacter(false);
  }, 450);
}

function clampFieldValue(fieldId, min, max) {
  const field = els.fields[fieldId];
  if (!field || field.value === "") {
    return;
  }
  const value = toSafeNumber(field.value, min);
  field.value = clamp(Math.trunc(value), min, max);
}

function bindEvents() {
  placeDicePanelByViewport();
  els.form.addEventListener("input", (event) => {
    if (event.target.id === "name") {
      updateSheetTitle({ name: event.target.value });
    }

    if (["strength", "agility", "presence", "toughness"].includes(event.target.id)) {
      clampFieldValue(event.target.id, -3, 6);
    }

    if (event.target.id === "level") {
      clampFieldValue("level", 1, 20);
    }

    if (event.target.id === "hpMax") {
      state.hpMaxHintVisible = false;
      syncCurrentHpTracker();
    }
    if (event.target.id === "hpCurrent") {
      state.hpMaxHintVisible = false;
      syncCurrentHpTracker();
    }
    if (event.target.id === "omens") {
      clampFieldValue("omens", 0, 9);
    }
    if (event.target.id === "weaponCustomDie") {
      clampFieldValue("weaponCustomDie", 2, 20);
    }
    if (event.target.id === "armorCustomDie") {
      clampFieldValue("armorCustomDie", 2, 20);
    }
    if (event.target.id === "powersKnownCount") {
      clampFieldValue("powersKnownCount", 0, KNOWN_POWERS_MAX);
      syncPowerTrackersFromUI();
    }
    if (event.target.id === "powersCastToday") {
      const castAttempts = Math.max(0, Math.trunc(toSafeNumber(els.fields.powersCastToday.value, 0)));
      els.fields.powersCastToday.value = String(castAttempts);
      syncPowerTrackersFromUI();
    }
    if (event.target.id === "sacredScrolls") {
      clampFieldValue("sacredScrolls", 0, 99);
    }
    if (event.target.id === "uncleanScrolls") {
      clampFieldValue("uncleanScrolls", 0, 99);
    }
    if (event.target.id === "silver") {
      const silver = Math.max(0, Math.trunc(toSafeNumber(els.fields.silver.value, 0)));
      els.fields.silver.value = silver;
    }
    if (event.target.id === "weapon" || event.target.id === "armor") {
      syncCustomEquipmentFields();
    }
    if (event.target instanceof Element && event.target.classList.contains("known-power-input")) {
      syncKnownPowersFromUI();
    }

    scheduleAutoSave();
    if (els.fields.className.value !== "Classless Scvm") {
      setStatus(
        "Class-specific starting rules vary. Randomize stays faithful to classless baseline.",
        "warn"
      );
    } else {
      setStatus("Changes pending...", "neutral");
    }
  });

  els.fields.weapon.addEventListener("change", syncCustomEquipmentFields);
  els.fields.armor.addEventListener("change", syncCustomEquipmentFields);
  els.form.addEventListener("click", (event) => {
    const origin = event.target;
    if (!(origin instanceof Element)) {
      return;
    }
    const hpButton = origin.closest("[data-hp-action]");
    if (hpButton instanceof HTMLElement) {
      const action = hpButton.dataset.hpAction;
      if (!action) {
        return;
      }
      adjustCurrentHp(action === "increment" ? 1 : -1);
      scheduleAutoSave();
      return;
    }
    const button = origin.closest("[data-power-action][data-power-target]");
    if (!(button instanceof HTMLElement)) {
      return;
    }
    const target = button.dataset.powerTarget;
    const action = button.dataset.powerAction;
    if (!target || !action) {
      return;
    }
    adjustPowerTracker(target, action === "increment" ? 1 : -1);
    scheduleAutoSave();
  });
  if (els.addKnownPower) {
    els.addKnownPower.addEventListener("click", () => {
      addKnownPowerRow("");
      syncKnownPowersFromUI();
      scheduleAutoSave();
      setStatus("Added known power slot.", "ok");
    });
  }
  if (els.knownPowersList) {
    els.knownPowersList.addEventListener("click", (event) => {
      const origin = event.target;
      if (!(origin instanceof Element)) {
        return;
      }
      const remove = origin.closest("[data-known-power-remove]");
      if (!(remove instanceof HTMLElement)) {
        return;
      }
      const row = remove.closest(".known-power-row");
      if (!(row instanceof HTMLElement)) {
        return;
      }
      row.remove();
      if (els.knownPowersList.querySelectorAll(".known-power-row").length === 0) {
        addKnownPowerRow("", false);
      }
      syncKnownPowersFromUI();
      scheduleAutoSave();
      setStatus("Known power removed.", "warn");
    });
  }

  els.newCharacter.addEventListener("click", createNewCharacter);
  els.randomCharacter.addEventListener("click", randomizeActiveCharacter);
  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", toggleTheme);
  }
  els.saveCharacter.addEventListener("click", () => saveActiveCharacter(true));
  els.deleteCharacter.addEventListener("click", deleteActiveCharacter);
  els.exportCharacter.addEventListener("click", exportActiveCharacter);
  els.importCharacter.addEventListener("click", () => {
    els.importFile.value = "";
    els.importFile.click();
  });
  els.importFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      await importCharacters(file);
    } catch (error) {
      setStatus(`Import failed: ${error.message}`, "error");
    } finally {
      els.importFile.value = "";
    }
  });
  bindDiceLazyLoading();
  window.addEventListener("resize", placeDicePanelByViewport);

  window.addEventListener("beforeunload", () => {
    if (state.diceTray) {
      state.diceTray.dispose();
    }
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      saveActiveCharacter(false);
    }
  });
}

function init() {
  ensureThemeToggleButton();
  applyTheme(resolveTheme(), false);
  renderFooterYear();
  renderLucideIcons();
  loadState();
  renderCharacterList();
  applyToForm(activeCharacter());
  setInlineDiceStatus("Dice tray ready.", "neutral");
  bindEvents();
  setStatus("Ready.", "ok");
}

init();

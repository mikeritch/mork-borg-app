const STORAGE_KEY = "morkborg-reliquary.characters.v1";
const ACTIVE_KEY = "morkborg-reliquary.active.v1";
const THEME_KEY = "morkborg-reliquary.theme.v1";
const INSTALL_HINT_KEY = "morkborg-reliquary.install-hint.v1";
const APP_VERSION = "__APP_VERSION__";
const CUSTOM_OPTION_VALUE = "__custom__";
const POWER_TRACKER_LENGTH = 12;
const KNOWN_POWERS_MAX = 99;
const DICE_MODULE_GLOBAL = "MorkBorgDice";
const DICE_MODULE_SCRIPT_ID = "mb-dice-module-script";
const DICE_MODULE_SCRIPT_SRC = "dice.js?v=20260226-local-dice-modules-fix1";
const DICE_MODULE_LOAD_MAX_ATTEMPTS = 3;
const DICE_MODULE_RETRY_BASE_DELAY_MS = 300;
const DICE_MODULE_LOAD_TIMEOUT_MS = 10000;
const RANDOMIZER_LIBRARY_URL = "data/randomizer-library.json";
const BACKSTORY_LIBRARY_URL = "data/backstories.json";
const EXPORT_FILE_HEADER = Object.freeze({
  app: "Character Reliquary",
  format: "character-sheet-export",
  version: 1,
});
const MAX_IMPORT_FILE_BYTES = 256 * 1024;
const MAX_IMPORT_FILE_SIZE_LABEL = "256 KB";
const AUTO_SAVE_INDICATOR_STATES = Object.freeze({
  saving: Object.freeze({
    label: "Saving...",
    title: "Saving changes locally",
  }),
  saved: Object.freeze({
    label: "Saved",
    title: "Changes saved locally",
  }),
  error: Object.freeze({
    label: "Save Error",
    title: "Browser storage is unavailable",
  }),
});
const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");
const SERVICE_WORKER_PATH = "/sw.js";
const SERVICE_WORKER_SCOPE = "/";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

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
  "shieldEquipped",
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
  "backstory",
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

const BOOLEAN_FIELDS = new Set(["shieldEquipped"]);

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
  shieldEquipped: false,
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
  backstory: "",
  notes: "",
};

const FALLBACK_BACKSTORY_LIBRARY = Object.freeze({
  themes: [
    Object.freeze({
      id: "gravebound",
      origin: Object.freeze([
        "{name} dragged themselves out of {homeland} with {trinket} clutched tight.",
        "In {homeland}, {name} became {epithet} after surviving a ditch full of the dead.",
      ]),
      fracture: Object.freeze([
        "A priest marked them with {scar}, then named them expendable.",
        "{notesHook}",
      ]),
      drive: Object.freeze([
        "Now they hunt redemption with {weapon} and a mouth full of curses.",
        "They keep moving so nobody can bury them again.",
      ]),
      doom: Object.freeze([
        "If the black bells toll, {name} swears they will answer first.",
        "Every firelight throws a shadow shaped like their own grave.",
      ]),
    }),
    Object.freeze({
      id: "ash-hunted",
      origin: Object.freeze([
        "{name} once marched as {className}, before the regiment burned.",
        "{name} fled {homeland} under arrows and plague smoke.",
      ]),
      fracture: Object.freeze([
        "They carry {trinket} because it is all that survived the pyres.",
        "{scar} reminds them what mercy costs in this world.",
      ]),
      drive: Object.freeze([
        "They sell steel until they can afford revenge.",
        "They lie about everything except the names of the dead.",
      ]),
      doom: Object.freeze([
        "Each dawn feels borrowed from someone else.",
        "Sooner or later, the hunters from {homeland} will catch their scent.",
      ]),
    }),
  ],
});

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
};

const WEAPON_CHOICES = new Set(["", CUSTOM_OPTION_VALUE, ...Object.keys(WEAPON_DATA)]);
const ARMOR_CHOICES = new Set(["", CUSTOM_OPTION_VALUE, ...Object.keys(ARMOR_DATA)]);

const FALLBACK_RANDOMIZER_LIBRARY = Object.freeze({
  namesA: Object.freeze(["Aerg-Tval", "Aldur", "Mirek", "Ravik"]),
  namesB: Object.freeze(["Ashborn", "Grimveil", "Ruin-Bell", "Bog-Saint"]),
  epithets: Object.freeze(["Bearer of Rotten Light", "Bell-Toll Penitent"]),
  homelands: Object.freeze(["Grift", "Sarkash", "Tveland"]),
  classlessLoadD6: Object.freeze(["Nothing", "Backpack (capacity: 7 normal items)", "Sack (capacity: 10 normal items)"]),
  classlessGearD12A: Object.freeze(["Rope (30ft)", "Torches (Presence + 4)", "Random unclean scroll"]),
  classlessGearD12B: Object.freeze(["Life elixir (d4 doses, heal d6 HP)", "Random sacred scroll", "Shield (-1 damage, or break to ignore one attack)"]),
  trinkets: Object.freeze(["A tooth carved with scripture", "A key with no known lock", "A bell that rings only underwater"]),
  notes: Object.freeze(["Owes a favor to a one-eyed butcher in Galgenbeck.", "Keeps a tally of each night survived in charcoal marks."]),
  scars: Object.freeze(["Acid pitting", "Ritual brand", "Clouded eye"]),
});

const generators = {
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
};

const state = {
  characters: [],
  activeId: null,
  saveTimer: null,
  randomizerLibrary: null,
  randomizerLibraryPromise: null,
  backstoryLibrary: null,
  backstoryLibraryPromise: null,
  diceTray: null,
  diceLoadPromise: null,
  diceInitPromise: null,
  hpMaxHintVisible: false,
  scrollWarningDismissed: false,
  confirmQueue: [],
  activeConfirmRequest: null,
  confirmRestoreFocus: null,
};

let didReloadOnServiceWorkerControllerChange = false;
let deferredInstallPrompt = null;
let hasInstalledAppHint = false;
let joinPartyTooltipCloseTimer = null;

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
  joinPartyTooltip: document.getElementById("join-party-tooltip"),
  installApp: document.getElementById("install-app"),
  saveIndicator: document.getElementById("save-indicator"),
  deleteCharacter: document.getElementById("delete-character"),
  exportCharacter: document.getElementById("export-character"),
  importCharacter: document.getElementById("import-character"),
  importFile: document.getElementById("import-file"),
  confirmModal: document.getElementById("confirm-modal"),
  confirmDialog: document.getElementById("confirm-dialog"),
  confirmTitle: document.getElementById("confirm-title"),
  confirmMessage: document.getElementById("confirm-message"),
  confirmCancel: document.getElementById("confirm-cancel"),
  confirmProceed: document.getElementById("confirm-proceed"),
  weaponCustomNameWrap: document.getElementById("weapon-custom-name-wrap"),
  weaponCustomDieWrap: document.getElementById("weapon-custom-die-wrap"),
  armorCustomNameWrap: document.getElementById("armor-custom-name-wrap"),
  armorCustomDieWrap: document.getElementById("armor-custom-die-wrap"),
  armorTotalValue: document.getElementById("armor-total-value"),
  armorTotalMeta: document.getElementById("armor-total-meta"),
  scrollGearWarning: document.getElementById("scroll-gear-warning"),
  scrollGearWarningDismiss: document.getElementById("scroll-gear-warning-dismiss"),
  carryLimitReadout: document.getElementById("carry-limit-readout"),
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
  footerVersion: document.getElementById("footer-version"),
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

function waitFor(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function removeDiceModuleScript() {
  const existingScript = document.getElementById(DICE_MODULE_SCRIPT_ID);
  if (existingScript) {
    existingScript.remove();
  }
}

function buildDiceModuleScriptSrc(attempt) {
  if (attempt <= 1) {
    return DICE_MODULE_SCRIPT_SRC;
  }
  // Retry marker helps avoid reusing a transient failed response path.
  const separator = DICE_MODULE_SCRIPT_SRC.includes("?") ? "&" : "?";
  return `${DICE_MODULE_SCRIPT_SRC}${separator}retry=${Date.now()}-${attempt}`;
}

function loadDiceModuleScriptAttempt(attempt) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = DICE_MODULE_SCRIPT_ID;
    script.src = buildDiceModuleScriptSrc(attempt);
    script.async = true;
    script.defer = true;
    script.setAttribute("data-loaded", "false");
    script.setAttribute("data-error", "false");

    let timeoutId = 0;
    let settled = false;

    const settle = (handler) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      handler();
    };

    const handleLoad = () => {
      settle(() => {
        script.setAttribute("data-loaded", "true");
        const factory = getDiceFactory();
        if (!factory) {
          script.setAttribute("data-error", "true");
          reject(new Error("Dice module loaded, but controller factory was missing."));
          return;
        }
        resolve(factory);
      });
    };

    const handleError = () => {
      settle(() => {
        script.setAttribute("data-error", "true");
        script.remove();
        reject(new Error("Failed to load dice module script."));
      });
    };

    timeoutId = window.setTimeout(() => {
      settle(() => {
        script.setAttribute("data-error", "true");
        script.remove();
        reject(new Error("Failed to load dice module script."));
      });
    }, DICE_MODULE_LOAD_TIMEOUT_MS);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });
}

function loadDiceModuleScript() {
  const existingFactory = getDiceFactory();
  if (existingFactory) {
    return Promise.resolve(existingFactory);
  }
  if (state.diceLoadPromise) {
    return state.diceLoadPromise;
  }

  state.diceLoadPromise = (async () => {
    let lastError = null;
    for (let attempt = 1; attempt <= DICE_MODULE_LOAD_MAX_ATTEMPTS; attempt += 1) {
      const factory = getDiceFactory();
      if (factory) {
        return factory;
      }
      removeDiceModuleScript();
      try {
        return await loadDiceModuleScriptAttempt(attempt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < DICE_MODULE_LOAD_MAX_ATTEMPTS) {
          await waitFor(DICE_MODULE_RETRY_BASE_DELAY_MS * attempt);
        }
      }
    }
    throw lastError || new Error("Failed to load dice module script.");
  })().catch((error) => {
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
  button.setAttribute("role", "switch");
  button.setAttribute("aria-pressed", "true");
  button.setAttribute("aria-checked", "true");
  button.setAttribute("aria-label", "Switch theme");
  button.title = "Switch theme";
  ensureThemeToggleContents(button);
  if (button.parentElement !== quickActions) {
    quickActions.insertBefore(button, quickActions.firstChild);
  } else if (quickActions.firstElementChild !== button) {
    quickActions.insertBefore(button, quickActions.firstChild);
  }
  els.themeToggle = button;
}

function ensureThemeToggleContents(button) {
  if (!(button instanceof HTMLElement)) {
    return null;
  }
  const existingLabel = button.querySelector(".theme-toggle-label");
  const existingGlyph = button.querySelector(".theme-toggle-glyph");
  if (existingLabel && existingGlyph) {
    return existingLabel;
  }

  const fallbackLabel = existingLabel?.textContent?.trim() || button.textContent.trim() || "Sinner";
  button.textContent = "";

  const glyph = document.createElement("span");
  glyph.className = "theme-toggle-glyph";
  glyph.setAttribute("aria-hidden", "true");

  const icon = document.createElement("i");
  icon.className = "stat-lucide theme-toggle-icon";
  icon.setAttribute("data-lucide", "sun-moon");
  glyph.appendChild(icon);

  const label = document.createElement("span");
  label.className = "theme-toggle-label";
  label.textContent = fallbackLabel;

  button.append(glyph, label);
  return label;
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
    const label = ensureThemeToggleContents(els.themeToggle);
    if (label) {
      label.textContent = darkOn ? "Sinner" : "Saint";
    }
    els.themeToggle.setAttribute("aria-pressed", String(darkOn));
    els.themeToggle.setAttribute("aria-checked", String(darkOn));
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

function toSafeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(clean)) {
      return true;
    }
    if (["false", "0", "no", "off", ""].includes(clean)) {
      return false;
    }
  }
  return fallback;
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
  if (
    character.armor === "Shield (-1 damage or break to ignore one attack)" ||
    character.armor === "Shield (-1 damage, or break to ignore one attack)"
  ) {
    character.shieldEquipped = true;
    character.armor = "No armor";
    return;
  }
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
  const shieldEquipped = toSafeBoolean(character.shieldEquipped, DEFAULTS.shieldEquipped);
  let armorTotalReduction = armor.reductionDie > 0 ? `-${dieText(armor.reductionDie)}` : "";
  if (shieldEquipped) {
    armorTotalReduction = armorTotalReduction ? `${armorTotalReduction} -1` : "-1";
  }
  character.damage = weapon.damage || DEFAULTS.damage;
  character.armorTier = armor.tier;
  character.weaponLabel = weapon.label;
  character.armorLabel = [armor.label, shieldEquipped ? "Shield" : ""].filter(Boolean).join(" + ");
  character.armorTotalReduction = armorTotalReduction || "none";
  character.shieldEquipped = shieldEquipped;
  if (!["Strength", "Presence", "Strength or Presence"].includes(character.attack)) {
    character.attack = weapon.attack || "Strength";
  }
}

function armorBlocksScrolls(character) {
  if (character.armor === "Medium armor (-d4 damage, DR +2 Agility tests)") {
    return true;
  }
  if (character.armor === "Heavy armor (-d6 damage, DR +4 Agility tests)") {
    return true;
  }
  if (character.armor === CUSTOM_OPTION_VALUE) {
    const die = clampCustomDie(character.armorCustomDie, DEFAULTS.armorCustomDie);
    return die >= 4;
  }
  return false;
}

function weaponBlocksScrolls(character) {
  return character.weapon === "Zweihander (d10)";
}

function hasAnyScrolls(character) {
  const sacred = Math.max(0, Math.trunc(toSafeNumber(character.sacredScrolls, 0)));
  const unclean = Math.max(0, Math.trunc(toSafeNumber(character.uncleanScrolls, 0)));
  return sacred + unclean > 0;
}

function syncCarryLimitReadout() {
  if (!els.carryLimitReadout || !els.fields.strength) {
    return;
  }
  const strength = clamp(Math.trunc(toSafeNumber(els.fields.strength.value, DEFAULTS.strength)), -3, 6);
  const carryLimit = Math.max(0, strength + 8);
  els.carryLimitReadout.textContent = String(carryLimit);
}

function equipmentSnapshotFromFields() {
  return {
    weapon: els.fields.weapon?.value || "",
    armor: els.fields.armor?.value || "",
    armorCustomName: els.fields.armorCustomName?.value || "",
    armorCustomDie: toSafeNumber(els.fields.armorCustomDie?.value, DEFAULTS.armorCustomDie),
    sacredScrolls: toSafeNumber(els.fields.sacredScrolls?.value, 0),
    uncleanScrolls: toSafeNumber(els.fields.uncleanScrolls?.value, 0),
    shieldEquipped:
      els.fields.shieldEquipped instanceof HTMLInputElement ? els.fields.shieldEquipped.checked : false,
  };
}

function setScrollWarningVisible(visible) {
  if (!els.scrollGearWarning) {
    return;
  }
  els.scrollGearWarning.hidden = !visible;
  els.scrollGearWarning.classList.toggle("is-hidden", !visible);
}

function armorSummaryFromCharacter(character) {
  const armor = resolvedArmor(character);
  const shieldEquipped = toSafeBoolean(character.shieldEquipped, DEFAULTS.shieldEquipped);
  const baseDie = armor.reductionDie;
  let value = "None";
  let detail = "No armor or shield equipped.";

  if (baseDie > 0 && shieldEquipped) {
    value = `-${dieText(baseDie)} -1`;
    detail = `${armor.label}; shield subtracts an additional 1 damage.`;
  } else if (baseDie > 0) {
    value = `-${dieText(baseDie)}`;
    detail = `${armor.label}.`;
  } else if (shieldEquipped) {
    value = "-1";
    detail = "Shield only: -1 damage.";
  }

  return { value, detail };
}

function syncEquipmentDerivedUi() {
  const snapshot = equipmentSnapshotFromFields();
  const armorSummary = armorSummaryFromCharacter(snapshot);
  if (els.armorTotalValue) {
    els.armorTotalValue.textContent = armorSummary.value;
  }
  if (els.armorTotalMeta) {
    els.armorTotalMeta.textContent = armorSummary.detail;
  }
  if (!els.scrollGearWarning) {
    return;
  }
  const shouldWarn = hasAnyScrolls(snapshot) && (weaponBlocksScrolls(snapshot) || armorBlocksScrolls(snapshot));
  if (!shouldWarn) {
    state.scrollWarningDismissed = false;
    setScrollWarningVisible(false);
    return;
  }
  setScrollWarningVisible(!state.scrollWarningDismissed);
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
  syncEquipmentDerivedUi();
}

function normalizeCharacter(candidate) {
  const baseline = createBlankCharacter();
  const merged = { ...baseline, ...(candidate || {}) };
  FIELD_IDS.forEach((id) => {
    if (BOOLEAN_FIELDS.has(id)) {
      merged[id] = toSafeBoolean(merged[id], baseline[id]);
    } else if (NUMERIC_FIELDS.has(id)) {
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
    setAutoSaveIndicator("saved");
    clearPendingSaveStatus();
  } catch (error) {
    setAutoSaveIndicator("error");
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
    if (!field) {
      return;
    }
    const value = character[id] ?? "";
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = toSafeBoolean(value, false);
      return;
    }
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
  state.scrollWarningDismissed = false;
  syncCustomEquipmentFields();
  syncCarryLimitReadout();
  state.hpMaxHintVisible = false;
  syncCurrentHpTracker();
  syncPowerTrackersFromCharacter(character);
  updateSheetTitle(character);
}

function pullFromForm(existing) {
  const source = existing ? { ...existing } : createBlankCharacter();
  FIELD_IDS.forEach((id) => {
    const element = els.fields[id];
    if (!element) {
      return;
    }
    if (BOOLEAN_FIELDS.has(id)) {
      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        source[id] = element.checked;
      } else {
        source[id] = toSafeBoolean(element?.value, DEFAULTS[id]);
      }
    } else if (NUMERIC_FIELDS.has(id)) {
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
    if (BOOLEAN_FIELDS.has(id)) {
      return toSafeBoolean(character[id], baseline) !== toSafeBoolean(baseline, false);
    }
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
  if (state.activeId && state.activeId !== id) {
    flushPendingAutoSave();
  }
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

function setAutoSaveIndicator(state = "saved") {
  if (!els.saveIndicator) {
    return;
  }
  const resolvedState = AUTO_SAVE_INDICATOR_STATES[state] ? state : "saved";
  const nextState = AUTO_SAVE_INDICATOR_STATES[resolvedState];
  els.saveIndicator.dataset.state = resolvedState;
  els.saveIndicator.textContent = nextState.label;
  els.saveIndicator.title = nextState.title;
}

function clearPendingSaveStatus() {
  if (!els.status) {
    return;
  }
  if (els.status.dataset.tone === "neutral" && els.status.textContent === "Changes pending...") {
    setStatus("Saved locally.", "ok");
  }
}

function flushPendingAutoSave() {
  if (!state.saveTimer) {
    return;
  }
  window.clearTimeout(state.saveTimer);
  state.saveTimer = null;
  saveActiveCharacter(false);
}

function focusElement(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  try {
    element.focus({ preventScroll: true });
  } catch (_error) {
    element.focus();
  }
}

function confirmModalFocusableElements() {
  if (!(els.confirmDialog instanceof HTMLElement)) {
    return [];
  }
  return Array.from(els.confirmDialog.querySelectorAll(MODAL_FOCUSABLE_SELECTOR)).filter((element) => {
    return (
      element instanceof HTMLElement &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0
    );
  });
}

function setConfirmModalOpen(isOpen) {
  if (!els.confirmModal) {
    return;
  }
  els.confirmModal.hidden = !isOpen;
  els.confirmModal.setAttribute("aria-hidden", isOpen ? "false" : "true");
  document.body.classList.toggle("app-modal-open", isOpen);
}

function showNextConfirmDialog() {
  if (state.activeConfirmRequest || state.confirmQueue.length === 0) {
    return;
  }
  const request = state.confirmQueue.shift();
  if (!request) {
    return;
  }

  if (!state.confirmRestoreFocus && document.activeElement instanceof HTMLElement) {
    state.confirmRestoreFocus = document.activeElement;
  }

  state.activeConfirmRequest = request;
  setConfirmModalOpen(true);

  if (els.confirmDialog) {
    els.confirmDialog.dataset.tone = request.tone;
  }
  if (els.confirmTitle) {
    els.confirmTitle.textContent = request.title;
  }
  if (els.confirmMessage) {
    els.confirmMessage.textContent = request.message;
  }
  if (els.confirmCancel) {
    els.confirmCancel.hidden = !request.showCancel;
    els.confirmCancel.setAttribute("aria-hidden", request.showCancel ? "false" : "true");
    els.confirmCancel.textContent = request.cancelLabel;
  }
  if (els.confirmProceed) {
    els.confirmProceed.textContent = request.confirmLabel;
    els.confirmProceed.classList.toggle("btn-danger", request.tone === "danger");
    els.confirmProceed.classList.toggle("btn-primary", request.tone !== "danger");
  }

  window.requestAnimationFrame(() => {
    focusElement(request.initialFocus === "cancel" ? els.confirmCancel : els.confirmProceed);
  });
}

function closeActiveConfirmDialog(result) {
  const request = state.activeConfirmRequest;
  if (!request) {
    return;
  }

  state.activeConfirmRequest = null;

  if (state.confirmQueue.length > 0) {
    request.resolve(result);
    showNextConfirmDialog();
    return;
  }

  setConfirmModalOpen(false);
  const restoreFocus = state.confirmRestoreFocus;
  state.confirmRestoreFocus = null;
  request.resolve(result);
  if (restoreFocus?.isConnected) {
    focusElement(restoreFocus);
  }
}

function buildDialogFallbackMessage(request) {
  return [request.title, request.message].filter(Boolean).join("\n\n");
}

function requestDialog(options) {
  const request = {
    title: options?.title || "Confirm action",
    message: options?.message || "Are you sure?",
    confirmLabel: options?.confirmLabel || "Proceed",
    cancelLabel: options?.cancelLabel || "Cancel",
    tone: options?.tone === "danger" ? "danger" : "warn",
    initialFocus: options?.initialFocus === "cancel" ? "cancel" : "proceed",
    showCancel: options?.showCancel !== false,
  };

  if (
    !els.confirmModal ||
    !els.confirmDialog ||
    !els.confirmTitle ||
    !els.confirmMessage ||
    !els.confirmCancel ||
    !els.confirmProceed
  ) {
    const fallbackMessage = buildDialogFallbackMessage(request);
    if (!request.showCancel) {
      window.alert(fallbackMessage);
      return Promise.resolve(true);
    }
    return Promise.resolve(window.confirm(fallbackMessage));
  }

  return new Promise((resolve) => {
    state.confirmQueue.push({ ...request, resolve });
    showNextConfirmDialog();
  });
}

function requestConfirmation(options) {
  return requestDialog({ ...options, showCancel: true });
}

function requestNotice(options) {
  return requestDialog({
    ...options,
    showCancel: false,
    confirmLabel: options?.confirmLabel || "Close",
    initialFocus: "proceed",
  }).then(() => undefined);
}

function handleConfirmDialogKeydown(event) {
  if (!state.activeConfirmRequest || !(els.confirmDialog instanceof HTMLElement)) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeActiveConfirmDialog(false);
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = confirmModalFocusableElements();
  if (focusable.length === 0) {
    event.preventDefault();
    focusElement(els.confirmDialog);
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  if (!(current instanceof HTMLElement) || !els.confirmDialog.contains(current)) {
    event.preventDefault();
    focusElement(event.shiftKey ? last : first);
    return;
  }

  if (!event.shiftKey && current === last) {
    event.preventDefault();
    focusElement(first);
    return;
  }

  if (event.shiftKey && current === first) {
    event.preventDefault();
    focusElement(last);
  }
}

function bindConfirmDialogEvents() {
  if (!els.confirmModal || !els.confirmCancel || !els.confirmProceed) {
    return;
  }

  els.confirmModal.addEventListener("click", (event) => {
    if (event.target === els.confirmModal) {
      closeActiveConfirmDialog(false);
    }
  });
  els.confirmCancel.addEventListener("click", () => {
    closeActiveConfirmDialog(false);
  });
  els.confirmProceed.addEventListener("click", () => {
    closeActiveConfirmDialog(true);
  });
  document.addEventListener("keydown", handleConfirmDialogKeydown);
}

function renderFooterYear() {
  if (!els.footerYear) {
    return;
  }
  els.footerYear.textContent = String(new Date().getFullYear());
}

function renderFooterVersion() {
  if (!els.footerVersion) {
    return;
  }
  if (/^\d+\.\d+\.\d+$/.test(APP_VERSION)) {
    els.footerVersion.textContent = `v${APP_VERSION}`;
    return;
  }
  els.footerVersion.textContent = "vdev";
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
  flushPendingAutoSave();
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

function normalizeRandomizerLibraryList(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeRandomizerLibrary(candidate) {
  const keys = [
    "namesA",
    "namesB",
    "epithets",
    "homelands",
    "classlessLoadD6",
    "classlessGearD12A",
    "classlessGearD12B",
    "trinkets",
    "notes",
    "scars",
  ];
  const normalized = {};
  keys.forEach((key) => {
    normalized[key] = normalizeRandomizerLibraryList(candidate?.[key]);
    if (normalized[key].length === 0) {
      normalized[key] = [...FALLBACK_RANDOMIZER_LIBRARY[key]];
    }
  });
  return normalized;
}

async function loadRandomizerLibrary() {
  if (state.randomizerLibrary) {
    return state.randomizerLibrary;
  }
  if (state.randomizerLibraryPromise) {
    return state.randomizerLibraryPromise;
  }

  state.randomizerLibraryPromise = (async () => {
    try {
      const response = await fetch(RANDOMIZER_LIBRARY_URL, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      state.randomizerLibrary = normalizeRandomizerLibrary(payload);
    } catch (error) {
      console.warn("Randomizer library failed to load; using built-in fallback.", error);
      state.randomizerLibrary = normalizeRandomizerLibrary(FALLBACK_RANDOMIZER_LIBRARY);
    } finally {
      state.randomizerLibraryPromise = null;
    }
    return state.randomizerLibrary;
  })();

  return state.randomizerLibraryPromise;
}

function randomName(library) {
  if (Math.random() < 0.42) {
    return pick(library.namesA);
  }
  return `${pick(library.namesA)} ${pick(library.namesB)}`;
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

function normalizeBackstoryChunkList(chunks) {
  if (!Array.isArray(chunks)) {
    return [];
  }
  return chunks.map((chunk) => String(chunk ?? "").trim()).filter(Boolean);
}

function normalizeBackstoryTheme(theme, fallbackId = "theme") {
  if (!theme || typeof theme !== "object") {
    return null;
  }
  const origin = normalizeBackstoryChunkList(theme.origin);
  const fracture = normalizeBackstoryChunkList(theme.fracture);
  const drive = normalizeBackstoryChunkList(theme.drive);
  const doom = normalizeBackstoryChunkList(theme.doom);
  if (origin.length === 0 || fracture.length === 0 || drive.length === 0 || doom.length === 0) {
    return null;
  }
  const id = String(theme.id ?? fallbackId).trim() || fallbackId;
  return { id, origin, fracture, drive, doom };
}

function normalizeBackstoryLibrary(candidate) {
  const rawThemes = Array.isArray(candidate?.themes) ? candidate.themes : [];
  const themes = rawThemes
    .map((theme, index) => normalizeBackstoryTheme(theme, `theme-${index + 1}`))
    .filter(Boolean);
  if (themes.length > 0) {
    return { themes };
  }
  return {
    themes: FALLBACK_BACKSTORY_LIBRARY.themes
      .map((theme, index) => normalizeBackstoryTheme(theme, `fallback-${index + 1}`))
      .filter(Boolean),
  };
}

async function loadBackstoryLibrary() {
  if (state.backstoryLibrary) {
    return state.backstoryLibrary;
  }
  if (state.backstoryLibraryPromise) {
    return state.backstoryLibraryPromise;
  }

  state.backstoryLibraryPromise = (async () => {
    try {
      const response = await fetch(BACKSTORY_LIBRARY_URL, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      state.backstoryLibrary = normalizeBackstoryLibrary(payload);
    } catch (error) {
      console.warn("Backstory library failed to load; using built-in fallback.", error);
      state.backstoryLibrary = normalizeBackstoryLibrary(FALLBACK_BACKSTORY_LIBRARY);
    } finally {
      state.backstoryLibraryPromise = null;
    }
    return state.backstoryLibrary;
  })();

  return state.backstoryLibraryPromise;
}

function backstoryContextFor(character) {
  return {
    name: String(character?.name ?? "").trim() || "This soul",
    epithet: String(character?.epithet ?? "").trim() || "the nameless wretch",
    homeland: String(character?.homeland ?? "").trim() || "a ruined hamlet",
    className: String(character?.className ?? "").trim() || DEFAULTS.className,
    scar: String(character?.scars ?? "").trim() || "a half-healed ritual brand",
    trinket: String(character?.trinket ?? "").trim() || "a rusted relic",
    weapon: stripTrailingParens(String(character?.weapon ?? "")).trim() || "a chipped blade",
    notesHook: String(character?.notes ?? "").trim() || "No confession escapes their teeth.",
  };
}

function applyBackstoryPlaceholders(chunk, context) {
  return String(chunk ?? "")
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_token, key) => {
      const value = context[key];
      return value == null ? "" : String(value);
    })
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function ensureSentenceEnding(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

async function generateBackstory(character) {
  const library = await loadBackstoryLibrary();
  const theme = pick(library.themes);
  if (!theme) {
    return "";
  }
  const context = backstoryContextFor(character);
  const chunks = [pick(theme.origin), pick(theme.fracture), pick(theme.drive), pick(theme.doom)];
  return chunks
    .map((chunk) => ensureSentenceEnding(applyBackstoryPlaceholders(chunk, context)))
    .filter(Boolean)
    .join(" ");
}

async function randomCharacterPatch() {
  const library = await loadRandomizerLibrary();
  const strength = rollAbilityModifier();
  const agility = rollAbilityModifier();
  const presence = rollAbilityModifier();
  const toughness = rollAbilityModifier();

  const load = pick(library.classlessLoadD6);
  const gearA = withPresenceScaling(pick(library.classlessGearD12A), presence);
  const gearB = pick(library.classlessGearD12B);
  const reducedStart = gearA.toLowerCase().includes("scroll") || gearB.toLowerCase().includes("scroll");
  const uncleanScrolls = /random unclean scroll/i.test(gearA) ? 1 : 0;
  const sacredScrolls = /random sacred scroll/i.test(gearB) ? 1 : 0;
  const shieldEquipped = /^shield\b/i.test(gearB);

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

  const notes = pick(library.notes);
  const patch = {
    name: randomName(library),
    epithet: pick(library.epithets),
    className: "Classless Scvm",
    homeland: pick(library.homelands),
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
    shieldEquipped,
    powersKnownCount: 0,
    powersCastToday: 0,
    powersKnownMarks: "",
    powersCastMarks: "",
    sacredScrolls,
    uncleanScrolls,
    powersKnown: "",
    powersNotes: "",
    attack: weapon.attack,
    scars: pick(library.scars),
    weapon: weapon.label,
    armor: armor.label,
    trinket: pick(library.trinkets),
    inventory: inventoryBits.join(", "),
    notes,
  };
  patch.backstory = await generateBackstory(patch);
  return patch;
}

async function randomizeActiveCharacter() {
  const existing = activeCharacter() || createBlankCharacter();
  const base = pullFromForm(existing);
  if (hasCharacterData(base)) {
    const label = base.name || "this character";
    const confirmed = await requestConfirmation({
      title: `Randomize ${label}?`,
      message: "This will overwrite the current character details.",
      confirmLabel: "Randomize",
      cancelLabel: "Cancel",
      tone: "warn",
    });
    if (!confirmed) {
      setStatus("Randomize canceled.", "warn");
      return;
    }
  }
  try {
    const randomizedPatch = await randomCharacterPatch();
    const randomized = normalizeCharacter({ ...base, ...randomizedPatch, updatedAt: nowIso() });
    upsertCharacter(randomized, false);
    applyToForm(randomized);
    setStatus("A classless soul is forged from the core tables.", "ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Randomize failed: ${message}`, "error");
  }
}

async function deleteActiveCharacter() {
  const current = activeCharacter();
  if (!current) {
    return;
  }
  const label = current.name || "this character";
  const confirmed = await requestConfirmation({
    title: `Delete ${label}?`,
    message: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    tone: "danger",
    initialFocus: "cancel",
  });
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
    header: EXPORT_FILE_HEADER,
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

function hasValidImportHeader(header) {
  return (
    header &&
    typeof header === "object" &&
    header.app === EXPORT_FILE_HEADER.app &&
    header.format === EXPORT_FILE_HEADER.format &&
    header.version === EXPORT_FILE_HEADER.version
  );
}

async function warnInvalidImport(title, message) {
  setStatus("Import rejected.", "error");
  await requestNotice({
    title,
    message,
    confirmLabel: "Close",
    tone: "danger",
  });
}

async function importCharacters(file) {
  flushPendingAutoSave();
  if (typeof file?.size === "number" && file.size > MAX_IMPORT_FILE_BYTES) {
    await warnInvalidImport(
      "Import rejected",
      `This file is too large to be a Character Reliquary export. Max size: ${MAX_IMPORT_FILE_SIZE_LABEL}.`
    );
    return;
  }

  const rawText = await file.text();
  if (rawText.length > MAX_IMPORT_FILE_BYTES) {
    await warnInvalidImport(
      "Import rejected",
      `This file is too large to be a Character Reliquary export. Max size: ${MAX_IMPORT_FILE_SIZE_LABEL}.`
    );
    return;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (_error) {
    await warnInvalidImport("Invalid JSON", "This file could not be parsed as JSON.");
    return;
  }

  if (!hasValidImportHeader(parsed?.header)) {
    await warnInvalidImport(
      "Import rejected",
      "This file doesn't match the Character Reliquary character sheet format."
    );
    return;
  }

  let incoming = [];

  if (parsed && Array.isArray(parsed.characters)) {
    incoming = parsed.characters;
  }

  const normalized = incoming.map(normalizeCharacter);
  if (normalized.length === 0) {
    await warnInvalidImport("Import rejected", "This export does not contain any characters.");
    return;
  }

  const byId = new Map(state.characters.map((sheet) => [sheet.id, sheet]));
  const collisions = normalized.filter((sheet) => byId.has(sheet.id));
  if (collisions.length > 0) {
    const preview = collisions
      .slice(0, 3)
      .map((sheet) => byId.get(sheet.id)?.name || sheet.name || "Unnamed Soul")
      .join(", ");
    const suffix = collisions.length > 3 ? ", ..." : "";
    const confirmed = await requestConfirmation({
      title: `Overwrite ${collisions.length} existing character(s)?`,
      message: `Import will replace: ${preview}${suffix}.`,
      confirmLabel: "Import",
      cancelLabel: "Cancel",
      tone: "warn",
    });
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
  setAutoSaveIndicator("saving");
  state.saveTimer = window.setTimeout(() => {
    state.saveTimer = null;
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
  bindConfirmDialogEvents();
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

    syncCarryLimitReadout();
    syncEquipmentDerivedUi();
    scheduleAutoSave();
    if (els.fields.className.value !== "Classless Scvm") {
      setStatus(
        "Class-specific starting rules vary.",
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
  if (els.scrollGearWarningDismiss) {
    els.scrollGearWarningDismiss.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.scrollWarningDismissed = true;
      setScrollWarningVisible(false);
    });
  }

  if (els.newCharacter) {
    els.newCharacter.addEventListener("click", createNewCharacter);
  }
  if (els.randomCharacter) {
    els.randomCharacter.addEventListener("click", randomizeActiveCharacter);
  }
  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", toggleTheme);
  }
  if (els.installApp) {
    els.installApp.addEventListener("click", handleInstallAppClick);
  }
  if (els.deleteCharacter) {
    els.deleteCharacter.addEventListener("click", deleteActiveCharacter);
  }
  if (els.exportCharacter) {
    els.exportCharacter.addEventListener("click", exportActiveCharacter);
  }
  if (els.importCharacter && els.importFile) {
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
  }
  bindDiceLazyLoading();
  window.addEventListener("resize", placeDicePanelByViewport);

  window.addEventListener("beforeunload", () => {
    if (state.diceTray) {
      state.diceTray.dispose();
    }
    flushPendingAutoSave();
  });
}

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }
  const iosStandalone = window.navigator && window.navigator.standalone === true;
  const displayModeStandalone =
    typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return Boolean(iosStandalone || displayModeStandalone);
}

function isAppleMobile() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isCoarsePointerDevice() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches;
}

function closeJoinPartyTooltip() {
  if (!els.joinPartyTooltip) {
    return;
  }
  els.joinPartyTooltip.removeAttribute("data-open");
  if (joinPartyTooltipCloseTimer) {
    window.clearTimeout(joinPartyTooltipCloseTimer);
    joinPartyTooltipCloseTimer = null;
  }
}

function openJoinPartyTooltip() {
  if (!els.joinPartyTooltip) {
    return;
  }
  els.joinPartyTooltip.setAttribute("data-open", "true");
  if (joinPartyTooltipCloseTimer) {
    window.clearTimeout(joinPartyTooltipCloseTimer);
  }
  joinPartyTooltipCloseTimer = window.setTimeout(() => {
    closeJoinPartyTooltip();
  }, 2200);
}

function setupJoinPartyTooltip() {
  const tooltip = els.joinPartyTooltip;
  if (!tooltip) {
    return;
  }

  tooltip.addEventListener("click", (event) => {
    if (!isCoarsePointerDevice()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (tooltip.getAttribute("data-open") === "true") {
      closeJoinPartyTooltip();
      return;
    }
    openJoinPartyTooltip();
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }
    if (!tooltip.contains(event.target)) {
      closeJoinPartyTooltip();
    }
  });

  window.addEventListener("scroll", () => {
    closeJoinPartyTooltip();
  }, { passive: true });
}

function isMobileUserAgent() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isFirefoxDesktop() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /firefox/i.test(navigator.userAgent) && !isMobileUserAgent();
}

function isSafariDesktop() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent;
  const hasSafariToken = /safari/i.test(userAgent);
  const excluded = /chrome|chromium|crios|edg|opr|opera|fxios|firefox/i.test(userAgent);
  return hasSafariToken && !excluded && !isMobileUserAgent();
}

function shouldHideInstallButton() {
  return isFirefoxDesktop() || isSafariDesktop();
}

function readInstallHint() {
  try {
    return localStorage.getItem(INSTALL_HINT_KEY) === "1";
  } catch (_error) {
    return false;
  }
}

function writeInstallHint(installed) {
  try {
    if (installed) {
      localStorage.setItem(INSTALL_HINT_KEY, "1");
      return;
    }
    localStorage.removeItem(INSTALL_HINT_KEY);
  } catch (_error) {
    // Ignore storage failures; install UX should still work.
  }
}

function setInstallButtonState() {
  if (!els.installApp) {
    return;
  }

  if (shouldHideInstallButton() || isStandaloneDisplayMode()) {
    els.installApp.hidden = true;
    els.installApp.setAttribute("aria-hidden", "true");
    return;
  }

  els.installApp.hidden = false;
  els.installApp.removeAttribute("aria-hidden");

  if (hasInstalledAppHint) {
    els.installApp.textContent = "Open App";
    els.installApp.disabled = false;
    els.installApp.removeAttribute("aria-disabled");
    els.installApp.title = "Open installed app";
    return;
  }

  els.installApp.textContent = "Install App";
  els.installApp.disabled = false;
  els.installApp.removeAttribute("aria-disabled");
  if (deferredInstallPrompt) {
    els.installApp.title = "Install app locally";
  } else if (isAppleMobile()) {
    els.installApp.title = "Use Share then Add to Home Screen";
  } else {
    els.installApp.title = "Install options depend on browser support";
  }
}

function setupInstallAppButton() {
  hasInstalledAppHint = readInstallHint();
  if (isStandaloneDisplayMode()) {
    hasInstalledAppHint = true;
    writeInstallHint(true);
  }
  setInstallButtonState();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    hasInstalledAppHint = false;
    writeInstallHint(false);
    setInstallButtonState();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hasInstalledAppHint = true;
    writeInstallHint(true);
    setInstallButtonState();
    setStatus("App installed locally.", "ok");
  });
}

async function handleInstallAppClick() {
  if (isStandaloneDisplayMode()) {
    setStatus("App is already open.", "ok");
    return;
  }

  if (hasInstalledAppHint) {
    const target = `${window.location.origin}/`;
    const opened = window.open(target, "_blank");
    if (!opened) {
      window.location.href = target;
    }
    setStatus("Opening app...", "ok");
    return;
  }

  if (deferredInstallPrompt && typeof deferredInstallPrompt.prompt === "function") {
    deferredInstallPrompt.prompt();
    const outcome = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setInstallButtonState();
    if (outcome && outcome.outcome === "accepted") {
      hasInstalledAppHint = true;
      writeInstallHint(true);
      setInstallButtonState();
      setStatus("Install accepted. Finishing setup...", "ok");
      return;
    }
    setStatus("Install dismissed.", "warn");
    return;
  }

  if (isAppleMobile()) {
    setStatus("On iOS: Share -> Add to Home Screen.", "warn");
    return;
  }

  setStatus("Install is unavailable right now. Try browser menu install options.", "warn");
}

function canRegisterServiceWorker() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (!("serviceWorker" in navigator)) {
    return false;
  }
  if (window.location.protocol === "https:") {
    return true;
  }
  return window.location.protocol === "http:" && LOCALHOST_HOSTNAMES.has(window.location.hostname);
}

function requestServiceWorkerActivation(worker) {
  if (!worker || typeof worker.postMessage !== "function") {
    return;
  }
  worker.postMessage({ type: "SKIP_WAITING" });
}

async function registerServiceWorker() {
  if (!canRegisterServiceWorker()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: SERVICE_WORKER_SCOPE,
      updateViaCache: "none",
    });

    if (registration.waiting) {
      requestServiceWorkerActivation(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) {
        return;
      }

      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          requestServiceWorkerActivation(registration.waiting || installing);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (didReloadOnServiceWorkerControllerChange) {
        return;
      }
      didReloadOnServiceWorkerControllerChange = true;
      window.location.reload();
    });
  } catch (error) {
    console.warn("Service worker registration failed:", error);
  }
}

function init() {
  ensureThemeToggleButton();
  setupJoinPartyTooltip();
  setupInstallAppButton();
  setAutoSaveIndicator("saved");
  applyTheme(resolveTheme(), false);
  renderFooterYear();
  renderFooterVersion();
  renderLucideIcons();
  loadState();
  renderCharacterList();
  applyToForm(activeCharacter());
  void loadRandomizerLibrary();
  void loadBackstoryLibrary();
  setInlineDiceStatus("Dice tray ready.", "neutral");
  bindEvents();
  registerServiceWorker();
  setStatus("Ready.", "ok");
}

init();

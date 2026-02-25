const STORAGE_KEY = "morkborg-reliquary.characters.v1";
const ACTIVE_KEY = "morkborg-reliquary.active.v1";

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
  "armorTier",
  "attack",
  "damage",
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
  "armorTier",
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
  armorTier: 0,
  attack: "+0",
  damage: "d6",
  scars: "",
  weapon: "",
  armor: "",
  trinket: "",
  inventory: "",
  notes: "",
};

const generators = {
  namesA: [
    "Aldur",
    "Vorn",
    "Nara",
    "Krag",
    "Mira",
    "Eld",
    "Tova",
    "Ravik",
    "Sable",
    "Wren",
    "Ysold",
    "Drogo",
    "Kelda",
    "Silas",
  ],
  namesB: [
    "Blacktongue",
    "Grimveil",
    "Ashborn",
    "Crowhand",
    "Dreadwake",
    "Corpsebane",
    "Rimeblood",
    "Mireclaw",
    "Skullmarrow",
    "Gloamchild",
    "Holloweye",
    "Graveshade",
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
    "The Valley of the Unfortunate Dead",
    "Galgenbeck outskirts",
    "A nameless plague village",
  ],
  weapons: [
    "Rust-eaten sword",
    "Notched hand axe",
    "Blackened spear",
    "Chained flail",
    "Sacrificial dagger",
    "War hammer",
    "Jagged bow and 12 arrows",
    "Hooked polearm",
  ],
  armors: ["None", "Light armor", "Light armor and shield", "Medium armor"],
  trinkets: [
    "A tooth carved with scripture",
    "A key with no known lock",
    "A shard of mirror that shows another face",
    "A bell that rings only underwater",
    "A vial of grave dirt and silver filings",
    "A saint's fingerbone wrapped in linen",
    "A black coin stamped with a blind eye",
    "A prayer strip sewn into skin",
  ],
  inventory: [
    "Rope (30ft)",
    "Torch x3",
    "Lantern and oil",
    "Flint and steel",
    "Iron spikes x6",
    "Bandages",
    "Moldy rations x2 days",
    "Small mirror",
    "Crowbar",
    "Chalk",
    "Lockpicks",
    "Tar pot",
    "Tin cup",
    "Waterskin",
  ],
  notes: [
    "Owes a favor to a one-eyed butcher in Galgenbeck.",
    "Dreams nightly of a throne built from bells.",
    "Believes they carry a prophecy carved into their scars.",
    "Will never enter a church again after the winter purge.",
    "Hunts the apostate who burned their kin.",
    "Claims to hear the sea inside sealed tombs.",
  ],
};

const state = {
  characters: [],
  activeId: null,
  saveTimer: null,
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
  saveCharacter: document.getElementById("save-character"),
  deleteCharacter: document.getElementById("delete-character"),
  exportCharacter: document.getElementById("export-character"),
  importCharacter: document.getElementById("import-character"),
  importFile: document.getElementById("import-file"),
  fields: Object.fromEntries(FIELD_IDS.map((id) => [id, document.getElementById(id)])),
};

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

function pickMany(items, count) {
  const copy = [...items];
  const chosen = [];
  while (copy.length > 0 && chosen.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    chosen.push(copy.splice(idx, 1)[0]);
  }
  return chosen;
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
    merged[stat] = clamp(Math.trunc(merged[stat]), -3, 3);
  });
  merged.hpMax = clamp(Math.trunc(merged.hpMax), 1, 30);
  merged.hpCurrent = clamp(Math.trunc(merged.hpCurrent), 0, merged.hpMax);
  merged.omens = clamp(Math.trunc(merged.omens), 0, 9);
  merged.silver = Math.max(0, Math.trunc(merged.silver));
  merged.armorTier = clamp(Math.trunc(merged.armorTier), 0, 3);
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
    els.fields[id].value = character[id] ?? "";
  });
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
    const updatedText = new Date(sheet.updatedAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
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

function createNewCharacter() {
  const fresh = createBlankCharacter();
  state.characters.unshift(fresh);
  state.activeId = fresh.id;
  persistState();
  renderCharacterList();
  applyToForm(fresh);
  setStatus("New character sheet ready.", "ok");
}

function randomStat() {
  return clamp(rollDice(2, 4) - 5, -3, 3);
}

function randomCharacterPatch() {
  const hpMax = Math.max(1, rollDice(1, 8));
  const inventoryBits = pickMany(generators.inventory, 4).join(", ");
  const attackBonus = Math.floor(Math.random() * 4) - 1;
  return {
    name: `${pick(generators.namesA)} ${pick(generators.namesB)}`,
    epithet: pick(generators.epithets),
    className: pick(generators.classes),
    homeland: pick(generators.homelands),
    age: String(rollDice(2, 10) + 8),
    level: 1,
    strength: randomStat(),
    agility: randomStat(),
    presence: randomStat(),
    toughness: randomStat(),
    hpCurrent: hpMax,
    hpMax,
    omens: rollDice(1, 2),
    silver: rollDice(2, 6) * 10,
    armorTier: Math.floor(Math.random() * 3),
    attack: `${attackBonus >= 0 ? "+" : ""}${attackBonus}`,
    damage: `d${[4, 6, 8, 10][Math.floor(Math.random() * 4)]}`,
    scars: pick(["Acid pitting", "Ritual brand", "Half-healed bite", "Old battlefield cut"]),
    weapon: pick(generators.weapons),
    armor: pick(generators.armors),
    trinket: pick(generators.trinkets),
    inventory: inventoryBits,
    notes: pick(generators.notes),
  };
}

function randomizeActiveCharacter() {
  const base = activeCharacter() || createBlankCharacter();
  const randomized = normalizeCharacter({
    ...base,
    ...randomCharacterPatch(),
    updatedAt: nowIso(),
  });
  upsertCharacter(randomized, false);
  applyToForm(randomized);
  setStatus("Generated a fresh doomed adventurer.", "ok");
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

function bindEvents() {
  els.form.addEventListener("input", (event) => {
    if (event.target.id === "name") {
      updateSheetTitle({ name: event.target.value });
    }
    if (event.target.id === "hpMax") {
      const hpMax = Math.max(1, toSafeNumber(els.fields.hpMax.value, 1));
      if (toSafeNumber(els.fields.hpCurrent.value, 0) > hpMax) {
        els.fields.hpCurrent.value = hpMax;
      }
    }
    scheduleAutoSave();
    setStatus("Changes pending...", "neutral");
  });

  els.newCharacter.addEventListener("click", createNewCharacter);
  els.randomCharacter.addEventListener("click", randomizeActiveCharacter);
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

  window.addEventListener("beforeunload", () => {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      saveActiveCharacter(false);
    }
  });
}

function init() {
  loadState();
  renderCharacterList();
  applyToForm(activeCharacter());
  bindEvents();
  setStatus("Ready. Your character sheets autosave locally.", "ok");
}

init();

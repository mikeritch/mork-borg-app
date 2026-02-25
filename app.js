const STORAGE_KEY = "morkborg-reliquary.characters.v1";
const ACTIVE_KEY = "morkborg-reliquary.active.v1";
const THEME_KEY = "morkborg-reliquary.theme.v1";
const CUSTOM_OPTION_VALUE = "__custom__";
const POWER_TRACKER_LENGTH = 12;
const KNOWN_POWERS_MAX = 99;
const DICE_SETTINGS_KEY = "mb_dice_settings_v1";
const DICE_HISTORY_KEY = "mb_dice_history_v1";
const DICE_HISTORY_LIMIT = 10;
const DICE_MAX_FORMULA_LENGTH = 72;
const DICE_MAX_DICE_PER_ROLL = 40;
const DICE_SETTLE_FRAMES = 20;
const DICE_SETTLE_TIMEOUT_MS = 9000;
const DICE_SETTLE_LINEAR = 0.17;
const DICE_SETTLE_ANGULAR = 0.27;
const DICE_ALLOWED_SIDES = new Set([2, 4, 6, 8, 10, 12, 20, 100]);
const DICE_MODES = Object.freeze({
  PROCEDURAL: "procedural",
  FALLBACK: "2d-fallback",
});
const DICE_MODULE_URLS = Object.freeze({
  three: "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js",
  cannon: "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js",
});

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

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // Ignore storage write issues for optional dice UI state.
  }
}

class RollParser {
  static parse(notation) {
    const compact = String(notation || "")
      .replace(/\s+/g, "")
      .toLowerCase();
    if (!compact) {
      throw new Error("Enter a roll formula first.");
    }
    if (compact.length > DICE_MAX_FORMULA_LENGTH) {
      throw new Error(`Formula is too long (max ${DICE_MAX_FORMULA_LENGTH} chars).`);
    }
    if (!/^[0-9d%+-]+$/.test(compact)) {
      throw new Error("Formula can only use digits, d, %, +, and -.");
    }

    let cursor = 0;
    let modifier = 0;
    const terms = [];
    let totalDice = 0;

    while (cursor < compact.length) {
      let sign = 1;
      if (compact[cursor] === "+") {
        cursor += 1;
      } else if (compact[cursor] === "-") {
        sign = -1;
        cursor += 1;
      }

      const tokenStart = cursor;
      while (cursor < compact.length && compact[cursor] !== "+" && compact[cursor] !== "-") {
        cursor += 1;
      }
      const token = compact.slice(tokenStart, cursor);
      if (!token) {
        throw new Error("Malformed formula around +/-.");
      }

      const diceMatch = token.match(/^(\d*)d(\d+|%)$/);
      if (diceMatch) {
        const count = Number(diceMatch[1] || 1);
        const sides = diceMatch[2] === "%" ? 100 : Number(diceMatch[2]);
        if (!Number.isInteger(count) || count < 1) {
          throw new Error("Dice count must be 1 or more.");
        }
        if (!Number.isInteger(sides) || !DICE_ALLOWED_SIDES.has(sides)) {
          throw new Error("Allowed dice: d2, d4, d6, d8, d10, d12, d20, d100/d%.");
        }
        totalDice += sides === 100 ? count * 2 : count;
        if (totalDice > DICE_MAX_DICE_PER_ROLL) {
          throw new Error(`Too many dice in one roll (max ${DICE_MAX_DICE_PER_ROLL}).`);
        }
        terms.push({ count, sides, sign });
        continue;
      }

      if (/^\d+$/.test(token)) {
        modifier += sign * Number(token);
        continue;
      }

      throw new Error(`Invalid token: ${token}`);
    }

    if (terms.length === 0 && modifier === 0) {
      throw new Error("Formula does not contain dice or modifiers.");
    }

    return {
      notation: compact,
      terms,
      modifier,
    };
  }
}

function buildD10Geometry(THREE, radius = 1) {
  const ringRadius = radius * 0.92;
  const poleHeight = radius * 0.92;
  const vertices = [];
  const faces = [];

  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5;
    vertices.push([Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius]);
  }

  const topIndex = vertices.length;
  vertices.push([0, poleHeight, 0]);
  const bottomIndex = vertices.length;
  vertices.push([0, -poleHeight, 0]);

  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    faces.push([topIndex, index, next]);
    faces.push([bottomIndex, next, index]);
  }

  const centroid = vertices.reduce(
    (sum, vertex) => {
      sum[0] += vertex[0];
      sum[1] += vertex[1];
      sum[2] += vertex[2];
      return sum;
    },
    [0, 0, 0]
  );
  centroid[0] /= vertices.length;
  centroid[1] /= vertices.length;
  centroid[2] /= vertices.length;

  const outwardFaces = faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    const ab = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]];
    const ac = [vc[0] - va[0], vc[1] - va[1], vc[2] - va[2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const center = [
      (va[0] + vb[0] + vc[0]) / 3,
      (va[1] + vb[1] + vc[1]) / 3,
      (va[2] + vb[2] + vc[2]) / 3,
    ];
    const out = [center[0] - centroid[0], center[1] - centroid[1], center[2] - centroid[2]];
    const dot = cross[0] * out[0] + cross[1] * out[1] + cross[2] * out[2];
    return dot < 0 ? [a, c, b] : [a, b, c];
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices.flat(), 3)
  );
  geometry.setIndex(outwardFaces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function geometryToConvexData(geometry) {
  const cloned = geometry.clone();
  if (!cloned.getIndex()) {
    const count = cloned.getAttribute("position").count;
    cloned.setIndex(Array.from({ length: count }, (_unused, index) => index));
  }

  const position = cloned.getAttribute("position");
  const indices = Array.from(cloned.getIndex().array);

  const uniqueVertices = [];
  const keyToIndex = new Map();
  const remap = new Array(position.count);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const key = `${x.toFixed(6)}|${y.toFixed(6)}|${z.toFixed(6)}`;
    let mapped = keyToIndex.get(key);
    if (mapped === undefined) {
      mapped = uniqueVertices.length;
      uniqueVertices.push([x, y, z]);
      keyToIndex.set(key, mapped);
    }
    remap[index] = mapped;
  }

  const faces = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = remap[indices[index]];
    const b = remap[indices[index + 1]];
    const c = remap[indices[index + 2]];
    if (a === b || b === c || a === c) {
      continue;
    }
    faces.push([a, b, c]);
  }

  return {
    vertices: uniqueVertices,
    faces,
  };
}

function clusterNormals(convexData, targetCount) {
  const centroid = convexData.vertices.reduce(
    (sum, [x, y, z]) => [sum[0] + x, sum[1] + y, sum[2] + z],
    [0, 0, 0]
  );
  const divisor = Math.max(1, convexData.vertices.length);
  centroid[0] /= divisor;
  centroid[1] /= divisor;
  centroid[2] /= divisor;

  const faceNormals = convexData.faces
    .map(([a, b, c]) => {
      const va = convexData.vertices[a];
      const vb = convexData.vertices[b];
      const vc = convexData.vertices[c];
      const ab = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]];
      const ac = [vc[0] - va[0], vc[1] - va[1], vc[2] - va[2]];
      const cross = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      const len = Math.hypot(cross[0], cross[1], cross[2]);
      if (len < 1e-8) {
        return null;
      }
      let normal = [cross[0] / len, cross[1] / len, cross[2] / len];
      const center = [
        (va[0] + vb[0] + vc[0]) / 3,
        (va[1] + vb[1] + vc[1]) / 3,
        (va[2] + vb[2] + vc[2]) / 3,
      ];
      const out = [center[0] - centroid[0], center[1] - centroid[1], center[2] - centroid[2]];
      const dot = normal[0] * out[0] + normal[1] * out[1] + normal[2] * out[2];
      if (dot < 0) {
        normal = [-normal[0], -normal[1], -normal[2]];
      }
      return {
        normal,
        center,
      };
    })
    .filter(Boolean);

  const thresholds = [0.999, 0.996, 0.992, 0.985, 0.97, 0.94];
  let bestGroups = [];
  let bestDiff = Number.POSITIVE_INFINITY;

  thresholds.forEach((threshold) => {
    const groups = [];
    faceNormals.forEach((face) => {
      const match = groups.find((group) => {
        return (
          face.normal[0] * group.normal[0] +
            face.normal[1] * group.normal[1] +
            face.normal[2] * group.normal[2] >
          threshold
        );
      });
      if (!match) {
        groups.push({
          normal: [...face.normal],
          center: [...face.center],
          count: 1,
        });
        return;
      }
      match.normal[0] += face.normal[0];
      match.normal[1] += face.normal[1];
      match.normal[2] += face.normal[2];
      match.center[0] += face.center[0];
      match.center[1] += face.center[1];
      match.center[2] += face.center[2];
      match.count += 1;
      const mag = Math.hypot(match.normal[0], match.normal[1], match.normal[2]) || 1;
      match.normal[0] /= mag;
      match.normal[1] /= mag;
      match.normal[2] /= mag;
    });

    const diff = targetCount ? Math.abs(groups.length - targetCount) : 0;
    if (diff < bestDiff) {
      bestDiff = diff;
      bestGroups = groups;
    }
  });

  bestGroups.sort((left, right) => {
    if (right.normal[1] !== left.normal[1]) {
      return right.normal[1] - left.normal[1];
    }
    if (right.normal[2] !== left.normal[2]) {
      return right.normal[2] - left.normal[2];
    }
    return right.normal[0] - left.normal[0];
  });

  return bestGroups.map((group, index) => ({
    normal: group.normal,
    center: [
      group.center[0] / Math.max(1, group.count),
      group.center[1] / Math.max(1, group.count),
      group.center[2] / Math.max(1, group.count),
    ],
    value: index + 1,
  }));
}

function createDieTemplates(THREE, CANNON) {
  const templateFromGeometry = (kind, geometry, expectedFaces, options = {}) => {
    geometry.computeVertexNormals();
    const convex = geometryToConvexData(geometry);
    const faceMap = options.faceMap || clusterNormals(convex, expectedFaces);
    const createShape = () =>
      new CANNON.ConvexPolyhedron({
        vertices: convex.vertices.map(([x, y, z]) => new CANNON.Vec3(x, y, z)),
        faces: convex.faces.map((face) => [...face]),
      });
    return {
      kind,
      geometry,
      createShape,
      faceMap: faceMap.map((entry) => ({
        normal: Array.isArray(entry.normal)
          ? new CANNON.Vec3(entry.normal[0], entry.normal[1], entry.normal[2])
          : new CANNON.Vec3(entry.normal.x, entry.normal.y, entry.normal.z),
        center: entry.center
          ? Array.isArray(entry.center)
            ? new CANNON.Vec3(entry.center[0], entry.center[1], entry.center[2])
            : new CANNON.Vec3(entry.center.x, entry.center.y, entry.center.z)
          : null,
        value: entry.value,
      })),
      mass: options.mass ?? 1,
    };
  };

  const d2Geometry = new THREE.CylinderGeometry(0.9, 0.9, 0.34, 24);

  return {
    d2: {
      kind: "d2",
      geometry: d2Geometry,
      createShape: () => new CANNON.Box(new CANNON.Vec3(0.86, 0.16, 0.86)),
      mass: 0.8,
      faceMap: [
        { normal: new CANNON.Vec3(0, 1, 0), value: 1 },
        { normal: new CANNON.Vec3(0, -1, 0), value: 2 },
      ],
    },
    d4: templateFromGeometry("d4", new THREE.TetrahedronGeometry(1), 4, { mass: 0.95 }),
    d6: templateFromGeometry("d6", new THREE.BoxGeometry(1.56, 1.56, 1.56), 6, { mass: 1.1 }),
    d8: templateFromGeometry("d8", new THREE.OctahedronGeometry(1.02), 8, { mass: 1 }),
    d10: templateFromGeometry("d10", buildD10Geometry(THREE, 1.03), 10, { mass: 1.05 }),
    d12: templateFromGeometry("d12", new THREE.DodecahedronGeometry(1), 12, { mass: 1.08 }),
    d20: templateFromGeometry("d20", new THREE.IcosahedronGeometry(1.03), 20, { mass: 1.12 }),
  };
}

class DicePhysicsEngine {
  constructor(CANNON) {
    this.CANNON = CANNON;
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -22, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.dynamicBodies = [];

    this.floorMaterial = new CANNON.Material("dice-floor");
    this.dieMaterial = new CANNON.Material("dice-body");
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.floorMaterial, this.dieMaterial, {
        friction: 0.34,
        restitution: 0.48,
      })
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.dieMaterial, this.dieMaterial, {
        friction: 0.24,
        restitution: 0.41,
      })
    );

    this.buildArena();
  }

  buildArena() {
    const floor = new this.CANNON.Body({
      type: this.CANNON.Body.STATIC,
      material: this.floorMaterial,
      shape: new this.CANNON.Plane(),
    });
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(floor);

    const wallShape = new this.CANNON.Box(new this.CANNON.Vec3(5, 2, 0.35));
    const walls = [
      { x: 0, y: 2, z: -4.9, rx: 0, ry: 0, rz: 0 },
      { x: 0, y: 2, z: 4.9, rx: 0, ry: 0, rz: 0 },
      { x: -4.9, y: 2, z: 0, rx: 0, ry: Math.PI / 2, rz: 0 },
      { x: 4.9, y: 2, z: 0, rx: 0, ry: Math.PI / 2, rz: 0 },
    ];

    walls.forEach((wall) => {
      const body = new this.CANNON.Body({
        type: this.CANNON.Body.STATIC,
        shape: wallShape,
        material: this.floorMaterial,
      });
      body.position.set(wall.x, wall.y, wall.z);
      body.quaternion.setFromEuler(wall.rx, wall.ry, wall.rz);
      this.world.addBody(body);
    });
  }

  clearDynamicBodies() {
    this.dynamicBodies.forEach((entry) => {
      this.world.removeBody(entry.body);
    });
    this.dynamicBodies = [];
  }

  spawnDie(template, orderIndex) {
    const body = new this.CANNON.Body({
      mass: template.mass,
      material: this.dieMaterial,
      allowSleep: true,
      sleepSpeedLimit: 0.11,
      sleepTimeLimit: 0.5,
      linearDamping: 0.2,
      angularDamping: 0.12,
    });
    body.addShape(template.createShape());
    body.position.set(
      (Math.random() - 0.5) * 3.2,
      5.6 + orderIndex * 0.24,
      (Math.random() - 0.5) * 3.2
    );
    body.quaternion.setFromEuler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    body.velocity.set((Math.random() - 0.5) * 6, 1 + Math.random() * 2.3, (Math.random() - 0.5) * 6);
    body.angularVelocity.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    this.world.addBody(body);
    this.dynamicBodies.push({ body });
    return body;
  }

  step(dtSeconds) {
    this.world.step(1 / 60, dtSeconds, 3);
  }

  isSettled() {
    return this.dynamicBodies.every((entry) => {
      return (
        entry.body.velocity.length() < DICE_SETTLE_LINEAR &&
        entry.body.angularVelocity.length() < DICE_SETTLE_ANGULAR
      );
    });
  }
}

class DiceRenderer {
  constructor(THREE, canvas, fallbackRoot) {
    this.THREE = THREE;
    this.canvas = canvas;
    this.fallbackRoot = fallbackRoot;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.meshMap = new Map();
    this.idlePreviewMesh = null;
    this.labelTextureCache = new Map();
    this.labelPlaneGeometry = null;
  }

  init() {
    if (!this.canvas) {
      return false;
    }

    this.renderer = new this.THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.setClearColor(0x120d11, 0.98);

    this.scene = new this.THREE.Scene();
    this.camera = new this.THREE.PerspectiveCamera(34, 1, 0.1, 120);
    this.camera.position.set(0, 7.1, 8.7);
    this.camera.lookAt(0, 0.8, 0);

    const ambient = new this.THREE.AmbientLight(0xf2dfc8, 0.78);
    this.scene.add(ambient);

    const key = new this.THREE.DirectionalLight(0xffe8c7, 1.16);
    key.position.set(5.8, 10, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);

    const fill = new this.THREE.PointLight(0x662631, 0.35, 18);
    fill.position.set(-4, 3.5, -3.2);
    this.scene.add(fill);

    const floor = new this.THREE.Mesh(
      new this.THREE.CircleGeometry(5, 48),
      new this.THREE.MeshStandardMaterial({
        color: 0x4b353e,
        roughness: 0.82,
        metalness: 0.08,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ring = new this.THREE.Mesh(
      new this.THREE.RingGeometry(4.5, 5, 72),
      new this.THREE.MeshBasicMaterial({
        color: 0x6f2a35,
        transparent: true,
        opacity: 0.18,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    const centerSigil = new this.THREE.Mesh(
      new this.THREE.CircleGeometry(0.38, 24),
      new this.THREE.MeshBasicMaterial({
        color: 0xc24856,
        transparent: true,
        opacity: 0.65,
      })
    );
    centerSigil.rotation.x = -Math.PI / 2;
    centerSigil.position.y = 0.02;
    this.scene.add(centerSigil);
    this.setupIdlePreview();

    this.resize();
    return true;
  }

  resize() {
    if (!this.renderer || !this.camera || !this.canvas) {
      return;
    }
    const width = this.canvas.clientWidth || 720;
    const height = this.canvas.clientHeight || 270;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render() {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  getFaceLabelTexture(label) {
    const key = String(label);
    if (this.labelTextureCache.has(key)) {
      return this.labelTextureCache.get(key);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const labelText = String(label);
    const center = canvas.width / 2;
    const fontSize =
      labelText.length >= 3 ? 208 : labelText.length === 2 ? 272 : 334;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `900 ${fontSize}px Cinzel, serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = labelText.length > 1 ? 26 : 30;
    context.strokeStyle = "rgba(18, 6, 9, 0.95)";
    context.fillStyle = "rgba(255, 244, 233, 0.98)";
    context.strokeText(labelText, center, center + 6);
    context.fillText(labelText, center, center + 6);

    const texture = new this.THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = true;
    texture.minFilter = this.THREE.LinearMipmapLinearFilter;
    texture.magFilter = this.THREE.LinearFilter;
    texture.colorSpace = this.THREE.SRGBColorSpace || texture.colorSpace;
    this.labelTextureCache.set(key, texture);
    return texture;
  }

  createFaceLabelMesh(label, size) {
    if (!this.labelPlaneGeometry) {
      this.labelPlaneGeometry = new this.THREE.PlaneGeometry(1, 1);
    }
    const texture = this.getFaceLabelTexture(label);
    if (!texture) {
      return null;
    }
    const mesh = new this.THREE.Mesh(
      this.labelPlaneGeometry,
      new this.THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: this.THREE.FrontSide,
        depthTest: true,
        depthWrite: false,
        alphaTest: 0.06,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    mesh.scale.set(size, size, size);
    mesh.renderOrder = 3;
    return mesh;
  }

  faceLabelsForKind(kind, count) {
    if (kind === "d10") {
      return Array.from({ length: count }, (_unused, index) => String(index));
    }
    return Array.from({ length: count }, (_unused, index) => String(index + 1));
  }

  addFaceLabels(mesh, template) {
    if (!template?.faceMap?.length) {
      return;
    }

    const sortedFaces = [...template.faceMap].sort((left, right) => left.value - right.value);
    const labels = this.faceLabelsForKind(template.kind, sortedFaces.length);
    if (!template.geometry.boundingSphere) {
      template.geometry.computeBoundingSphere();
    }
    const radius = template.geometry.boundingSphere?.radius || 1;
    const scaleMap = {
      d2: 0.6,
      d4: 0.56,
      d6: 0.56,
      d8: 0.5,
      d10: 0.42,
      d12: 0.34,
      d20: 0.37,
    };
    const offsetMap = {
      d2: 0.18,
      d4: 0.34,
      d6: 0.58,
      d8: 0.58,
      d10: 0.62,
      d12: 0.8,
      d20: 0.8,
    };
    const labelSize = (scaleMap[template.kind] || 0.18) * radius;
    const offset = (offsetMap[template.kind] || 0.62) * radius + radius * 0.012;
    const surfaceNudge = radius * 0.018;
    const zAxis = new this.THREE.Vector3(0, 0, 1);

    sortedFaces.forEach((entry, index) => {
      const label = this.createFaceLabelMesh(labels[index] ?? entry.value, labelSize);
      if (!label) {
        return;
      }
      const normal = new this.THREE.Vector3(entry.normal.x, entry.normal.y, entry.normal.z).normalize();
      if (entry.center) {
        const center = new this.THREE.Vector3(entry.center.x, entry.center.y, entry.center.z);
        label.position.copy(center).addScaledVector(normal, surfaceNudge);
      } else {
        label.position.copy(normal).multiplyScalar(offset);
      }
      label.quaternion.setFromUnitVectors(zAxis, normal);
      mesh.add(label);
    });
  }

  setupIdlePreview() {
    const preview = new this.THREE.Mesh(
      new this.THREE.IcosahedronGeometry(0.82),
      new this.THREE.MeshStandardMaterial({
        color: 0xf0d7bf,
        emissive: 0x3a1016,
        emissiveIntensity: 0.12,
        roughness: 0.48,
        metalness: 0.26,
      })
    );
    preview.castShadow = true;
    preview.receiveShadow = true;
    preview.position.set(0, 1.28, 0);

    const edges = new this.THREE.LineSegments(
      new this.THREE.EdgesGeometry(preview.geometry),
      new this.THREE.LineBasicMaterial({
        color: 0x3d1117,
        transparent: true,
        opacity: 0.8,
      })
    );
    preview.add(edges);
    this.scene.add(preview);
    this.idlePreviewMesh = preview;
  }

  setIdlePreviewVisible(isVisible) {
    if (!this.idlePreviewMesh) {
      return;
    }
    this.idlePreviewMesh.visible = isVisible;
  }

  animateIdlePreview(dtSeconds) {
    if (!this.idlePreviewMesh || !this.idlePreviewMesh.visible) {
      return;
    }
    this.idlePreviewMesh.rotation.x += dtSeconds * 0.68;
    this.idlePreviewMesh.rotation.y += dtSeconds * 1.04;
  }

  clearDice() {
    this.meshMap.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.meshMap.clear();
  }

  mark3DActive(isActive) {
    if (!this.canvas || !this.fallbackRoot) {
      return;
    }
    this.canvas.hidden = !isActive;
    this.fallbackRoot.hidden = isActive;
  }

  writeFallbackTokens(labels, finalValues = null, rolling = false) {
    if (!this.fallbackRoot) {
      return;
    }
    const list = document.createElement("div");
    list.className = "dice-fallback-list";

    labels.forEach((label, index) => {
      const token = document.createElement("div");
      token.className = "dice-fallback-token";
      if (rolling) {
        token.classList.add("is-rolling");
      }
      const display = finalValues ? `${label}:${finalValues[index]}` : `${label}:?`;
      token.textContent = display;
      list.appendChild(token);
    });

    this.fallbackRoot.innerHTML = "";
    this.fallbackRoot.appendChild(list);
  }

  addMesh(body, mesh) {
    this.meshMap.set(body, mesh);
    this.scene.add(mesh);
    this.syncBodyMesh(body, mesh);
  }

  syncBodyMesh(body, mesh) {
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  }

  syncAllBodies(records) {
    records.forEach((record) => {
      const mesh = this.meshMap.get(record.body);
      if (!mesh) {
        return;
      }
      this.syncBodyMesh(record.body, mesh);
    });
  }

  createProceduralMesh(template) {
    const palette = {
      d2: 0xe4d8c7,
      d4: 0xdbc99f,
      d6: 0xc9d7e4,
      d8: 0xdcc3b4,
      d10: 0xccb2bf,
      d12: 0xc7d2ad,
      d20: 0xe1bf9d,
    };
    const baseColor = palette[template.kind] || 0xd9c9b4;
    const base = new this.THREE.Mesh(
      template.geometry.clone(),
      new this.THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: 0x2a0f14,
        emissiveIntensity: 0.1,
        roughness: 0.56,
        metalness: 0.2,
        side: template.kind === "d10" ? this.THREE.DoubleSide : this.THREE.FrontSide,
      })
    );
    base.castShadow = true;
    base.receiveShadow = true;

    const edges = new this.THREE.LineSegments(
      new this.THREE.EdgesGeometry(template.geometry),
      new this.THREE.LineBasicMaterial({
        color: 0x230f15,
        transparent: true,
        opacity: 0.75,
      })
    );
    base.add(edges);
    return base;
  }

  buildMesh(_kind, _mode, template) {
    const mesh = this.createProceduralMesh(template);
    this.addFaceLabels(mesh, template);
    return { mesh };
  }
}

class DiceTrayController {
  constructor(params) {
    this.setGlobalStatus = params.setGlobalStatus;
    this.panel = params.panel;
    this.toggle = params.toggle;
    this.body = params.body;
    this.formula = params.formula;
    this.rollButton = params.rollButton;
    this.historyEl = params.history;
    this.advanced = params.advanced;
    this.force2d = params.force2d;
    this.canvas = params.canvas;
    this.fallback = params.fallback;
    this.status = params.status;
    this.root = params.root;

    this.settings = {
      notation: "d20",
      force2d: false,
      advancedOpen: false,
    };
    this.history = [];
    this.modules = null;
    this.renderer = null;
    this.physics = null;
    this.templates = null;
    this.rolling = false;
    this.animationFrame = 0;
    this.idleFrame = 0;
    this.loadPromise = null;
    this.hasRolled = false;

    this.onResize = () => {
      if (this.renderer) {
        this.renderer.resize();
        this.renderer.render();
      }
    };
  }

  init() {
    if (!this.panel || !this.toggle || !this.body || !this.formula || !this.rollButton) {
      return;
    }

    const storedSettings = readJsonStorage(DICE_SETTINGS_KEY, null);
    if (storedSettings && typeof storedSettings === "object") {
      this.settings.notation =
        typeof storedSettings.notation === "string" && storedSettings.notation.trim()
          ? storedSettings.notation.slice(0, DICE_MAX_FORMULA_LENGTH)
          : this.settings.notation;
      this.settings.force2d = false;
      this.settings.advancedOpen = Boolean(storedSettings.advancedOpen);
    }

    const storedHistory = readJsonStorage(DICE_HISTORY_KEY, []);
    if (Array.isArray(storedHistory)) {
      this.history = storedHistory
        .filter((entry) => entry && typeof entry === "object")
        .slice(0, DICE_HISTORY_LIMIT);
    }

    this.formula.value = this.settings.notation;
    if (this.force2d) {
      this.force2d.checked = this.settings.force2d;
    }
    if (this.advanced) {
      this.advanced.open = this.settings.advancedOpen;
    }

    this.panel.dataset.collapsed = "true";
    this.body.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    let idleFallback = false;
    if (!this.canUse3D()) {
      this.showFallbackIdle("2D fallback forced (debug mode).", "warn");
      idleFallback = true;
    } else if (this.canvas && this.fallback) {
      this.canvas.hidden = false;
      this.fallback.hidden = true;
      this.fallback.innerHTML = "";
    }
    this.renderHistory();
    if (!idleFallback) {
      this.writeStatus("Dice tray ready.", "neutral");
    }
    this.bindEvents();
  }

  bindEvents() {
    this.toggle.addEventListener("click", () => {
      const open = this.panel.dataset.collapsed === "true";
      this.panel.dataset.collapsed = open ? "false" : "true";
      this.body.hidden = !open;
      this.toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        if (this.canUse3D()) {
          this.ensure3DEngine().then((ready) => {
            if (ready && !this.hasRolled) {
              this.startIdleRenderLoop();
            }
          });
        } else {
          this.showFallbackIdle("2D fallback forced (debug mode).", "warn");
        }
      } else {
        this.stopIdleRenderLoop();
      }
      if (open && this.renderer) {
        window.setTimeout(() => {
          this.renderer.resize();
          this.renderer.render();
        }, 20);
      }
    });

    this.rollButton.addEventListener("click", () => {
      this.roll();
    });

    this.formula.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      this.roll();
    });

    if (this.root) {
      this.root.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const chip = target.closest("[data-dice-chip]");
        if (!(chip instanceof HTMLElement)) {
          return;
        }
        const value = String(chip.dataset.diceChip || "").trim();
        if (!value) {
          return;
        }
        this.formula.value = value;
        this.settings.notation = value;
        this.persistSettings();
        chip.classList.add("is-used");
        window.setTimeout(() => chip.classList.remove("is-used"), 220);
      });
    }

    if (this.force2d) {
      this.force2d.addEventListener("change", () => {
        this.settings.force2d = Boolean(this.force2d.checked);
        this.persistSettings();
        if (this.settings.force2d) {
          this.stopIdleRenderLoop();
          this.showFallbackIdle("2D fallback forced (debug mode).", "warn");
        } else {
          this.writeStatus("3D mode restored when available.", "warn");
          if (this.panel.dataset.collapsed === "false" && this.canUse3D()) {
            this.ensure3DEngine().then((ready) => {
              if (ready && !this.hasRolled) {
                this.startIdleRenderLoop();
              }
            });
          }
        }
      });
    }

    if (this.advanced) {
      this.advanced.addEventListener("toggle", () => {
        this.settings.advancedOpen = this.advanced.open;
        this.persistSettings();
      });
    }

    window.addEventListener("resize", this.onResize);
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.stopIdleRenderLoop();
    window.removeEventListener("resize", this.onResize);
  }

  startIdleRenderLoop() {
    if (this.idleFrame || !this.renderer || this.hasRolled) {
      return;
    }
    this.renderer.setIdlePreviewVisible(true);
    let last = performance.now();
    const tick = (now) => {
      this.idleFrame = 0;
      if (!this.renderer || this.rolling || this.panel.dataset.collapsed === "true") {
        return;
      }
      const dt = Math.min(0.05, Math.max(1 / 300, (now - last) / 1000));
      last = now;
      this.renderer.animateIdlePreview(dt);
      this.renderer.render();
      this.idleFrame = requestAnimationFrame(tick);
    };
    this.idleFrame = requestAnimationFrame(tick);
  }

  stopIdleRenderLoop() {
    if (!this.idleFrame) {
      return;
    }
    cancelAnimationFrame(this.idleFrame);
    this.idleFrame = 0;
  }

  writeStatus(message, tone = "neutral") {
    if (this.status) {
      this.status.textContent = message;
      this.status.dataset.tone = tone;
    }
  }

  persistSettings() {
    writeJsonStorage(DICE_SETTINGS_KEY, this.settings);
  }

  persistHistory() {
    writeJsonStorage(DICE_HISTORY_KEY, this.history.slice(0, DICE_HISTORY_LIMIT));
  }

  canUse3D() {
    return !this.settings.force2d;
  }

  showFallbackIdle(message, tone = "neutral") {
    if (this.canvas && this.fallback) {
      this.canvas.hidden = true;
      this.fallback.hidden = false;
      const labels = ["d20", "d12", "d8", "d6"];
      this.fallback.innerHTML = "";
      const list = document.createElement("div");
      list.className = "dice-fallback-list";
      labels.forEach((label) => {
        const token = document.createElement("div");
        token.className = "dice-fallback-token";
        token.textContent = `${label}:--`;
        list.appendChild(token);
      });
      this.fallback.appendChild(list);
    }
    this.writeStatus(message, tone);
  }

  async ensure3DEngine() {
    if (this.renderer && this.physics && this.templates) {
      return true;
    }
    if (!this.canUse3D()) {
      return false;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const importFirst = async (urls) => {
          let lastError = null;
          for (const url of urls) {
            try {
              return await import(url);
            } catch (error) {
              lastError = error;
            }
          }
          throw lastError || new Error("Module import failed.");
        };

        const [threeModuleRaw, cannonModuleRaw] = await Promise.all([
          importFirst([
            DICE_MODULE_URLS.three,
            "https://unpkg.com/three@0.161.0/build/three.module.js",
            "https://esm.sh/three@0.161.0",
          ]),
          importFirst([
            DICE_MODULE_URLS.cannon,
            "https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js",
            "https://esm.sh/cannon-es@0.20.0",
          ]),
        ]);

        const normalizeNamespace = (rawModule, requiredMember) => {
          if (rawModule && rawModule[requiredMember]) {
            return rawModule;
          }
          if (rawModule?.default && rawModule.default[requiredMember]) {
            return rawModule.default;
          }
          return rawModule?.default || rawModule;
        };

        const THREE = normalizeNamespace(threeModuleRaw, "WebGLRenderer");
        const CANNON = normalizeNamespace(cannonModuleRaw, "World");

        if (!THREE?.WebGLRenderer) {
          throw new Error("Three.js module did not load correctly.");
        }
        if (!CANNON?.World) {
          throw new Error("Cannon physics module did not load correctly.");
        }

        this.modules = {
          THREE,
          CANNON,
        };
        this.templates = createDieTemplates(this.modules.THREE, this.modules.CANNON);
        this.physics = new DicePhysicsEngine(this.modules.CANNON);
        this.renderer = new DiceRenderer(
          this.modules.THREE,
          this.canvas,
          this.fallback
        );
        if (!this.renderer.init()) {
          throw new Error("Renderer failed to initialize.");
        }
        this.renderer.mark3DActive(true);
        this.renderer.render();
        this.writeStatus("3D engine ready.", "ok");
        if (this.panel.dataset.collapsed !== "true" && !this.hasRolled) {
          this.startIdleRenderLoop();
        }
        return true;
      } catch (error) {
        this.renderer = null;
        this.physics = null;
        this.templates = null;
        this.modules = null;
        const detail = error instanceof Error ? error.message : "Unknown load failure.";
        this.showFallbackIdle(`3D load failed (${detail}). Rolling with 2D fallback.`, "warn");
        if (typeof this.setGlobalStatus === "function") {
          this.setGlobalStatus(`3D load failed: ${detail}`, "error");
        }
        return false;
      }
    })();

    const ready = await this.loadPromise;
    this.loadPromise = null;
    return ready;
  }

  expandRequest(request) {
    const dice = [];
    let percentileIndex = 0;
    request.terms.forEach((term) => {
      for (let count = 0; count < term.count; count += 1) {
        if (term.sides === 100) {
          const groupId = `d100-${percentileIndex++}`;
          dice.push({
            kind: "d10",
            displayDie: "d100",
            groupId,
            groupPart: "tens",
            sign: term.sign,
          });
          dice.push({
            kind: "d10",
            displayDie: "d100",
            groupId,
            groupPart: "ones",
            sign: term.sign,
          });
          continue;
        }
        dice.push({
          kind: `d${term.sides}`,
          displayDie: `d${term.sides}`,
          sign: term.sign,
        });
      }
    });
    return dice;
  }

  resolveFaceUp(record) {
    const { body, template } = record;
    let bestValue = template.faceMap[0]?.value ?? 1;
    let bestDot = Number.NEGATIVE_INFINITY;

    template.faceMap.forEach((face) => {
      const worldNormal = new this.modules.CANNON.Vec3();
      body.quaternion.vmult(face.normal, worldNormal);
      if (worldNormal.y > bestDot) {
        bestDot = worldNormal.y;
        bestValue = face.value;
      }
    });

    return bestValue;
  }

  resolveFromRecords(request, records) {
    const grouped = new Map();
    const rolls = [];
    let total = request.modifier;

    records.forEach((record) => {
      const value = this.resolveFaceUp(record);
      if (record.spec.groupId) {
        const existing = grouped.get(record.spec.groupId) || {
          sign: record.spec.sign,
          tens: 0,
          ones: 0,
        };
        const digit = value % 10;
        if (record.spec.groupPart === "tens") {
          existing.tens = digit;
        } else {
          existing.ones = digit;
        }
        grouped.set(record.spec.groupId, existing);
        return;
      }
      rolls.push({
        die: record.spec.displayDie,
        value,
        sign: record.spec.sign,
      });
      total += record.spec.sign * value;
    });

    grouped.forEach((group) => {
      const percentile = group.tens === 0 && group.ones === 0 ? 100 : group.tens * 10 + group.ones;
      rolls.push({
        die: "d100",
        value: percentile,
        sign: group.sign,
      });
      total += group.sign * percentile;
    });

    return {
      timestamp: nowIso(),
      notation: request.notation,
      total,
      rolls,
      mode: DICE_MODES.PROCEDURAL,
      source: "physics-face-up",
    };
  }

  rollWithRng(request) {
    const rolls = [];
    let total = request.modifier;

    request.terms.forEach((term) => {
      for (let index = 0; index < term.count; index += 1) {
        if (term.sides === 100) {
          const tens = Math.floor(Math.random() * 10);
          const ones = Math.floor(Math.random() * 10);
          const percentile = tens === 0 && ones === 0 ? 100 : tens * 10 + ones;
          rolls.push({ die: "d100", value: percentile, sign: term.sign });
          total += term.sign * percentile;
          continue;
        }
        const value = Math.floor(Math.random() * term.sides) + 1;
        rolls.push({ die: `d${term.sides}`, value, sign: term.sign });
        total += term.sign * value;
      }
    });

    return {
      timestamp: nowIso(),
      notation: request.notation,
      total,
      rolls,
      mode: DICE_MODES.FALLBACK,
      source: "fallback-rng",
    };
  }

  async runFallback(request, reason = "") {
    const result = this.rollWithRng(request);
    const labels = result.rolls.map((entry) => entry.die);
    const values = result.rolls.map((entry) => String(entry.value));

    if (this.renderer) {
      this.renderer.mark3DActive(false);
      this.renderer.writeFallbackTokens(labels, null, true);
    } else if (this.canvas && this.fallback) {
      this.canvas.hidden = true;
      this.fallback.hidden = false;
      this.fallback.innerHTML = "";
      const tokenList = document.createElement("div");
      tokenList.className = "dice-fallback-list";
      labels.forEach((label) => {
        const token = document.createElement("div");
        token.className = "dice-fallback-token is-rolling";
        token.textContent = `${label}:?`;
        tokenList.appendChild(token);
      });
      this.fallback.appendChild(tokenList);
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 520);
    });

    if (this.renderer) {
      this.renderer.writeFallbackTokens(labels, values, false);
    } else if (this.fallback) {
      const tokens = Array.from(this.fallback.querySelectorAll(".dice-fallback-token"));
      tokens.forEach((token, index) => {
        token.classList.remove("is-rolling");
        token.textContent = `${labels[index]}:${values[index]}`;
      });
    }

    const fallbackStatus = reason
      ? `${reason} ${result.notation} = ${result.total}`
      : `2D fallback result. ${result.notation} = ${result.total}`;
    this.commitResult(result, fallbackStatus);
  }

  commitResult(result, statusMessage) {
    this.history.unshift(result);
    this.history = this.history.slice(0, DICE_HISTORY_LIMIT);
    this.persistHistory();
    this.renderHistory();
    const sourceSuffix = result.source === "physics-face-up" ? " [3D]" : " [2D fallback]";
    this.writeStatus(
      `${statusMessage || `Rolled ${result.notation} = ${result.total}`}${sourceSuffix}`,
      "neutral"
    );
    if (typeof this.setGlobalStatus === "function") {
      const globalSuffix = result.source === "physics-face-up" ? " (3D)" : " (2D fallback)";
      this.setGlobalStatus(`Rolled ${result.notation} = ${result.total}${globalSuffix}.`, "ok");
    }
  }

  renderHistory() {
    if (!this.historyEl) {
      return;
    }
    this.historyEl.innerHTML = "";
    if (this.history.length === 0) {
      const empty = document.createElement("li");
      empty.className = "dice-history-item";
      empty.textContent = "No rolls yet.";
      this.historyEl.appendChild(empty);
      return;
    }

    this.history.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "dice-history-item";

      const main = document.createElement("div");
      main.className = "dice-history-main";
      const notation = document.createElement("span");
      notation.textContent = entry.notation || "roll";
      const total = document.createElement("span");
      total.className = "dice-history-total";
      total.textContent = `= ${entry.total}`;
      main.appendChild(notation);
      main.appendChild(total);

      const meta = document.createElement("div");
      meta.className = "dice-history-meta";
      const breakdown = Array.isArray(entry.rolls)
        ? entry.rolls
            .map((roll) => `${roll.sign < 0 ? "-" : "+"}${roll.die}:${roll.value}`)
            .join(" ")
        : "";
      const modeLabel = entry.mode === DICE_MODES.FALLBACK ? "2D fallback" : entry.mode;
      meta.textContent = `${modeLabel} | ${breakdown}`;

      item.appendChild(main);
      item.appendChild(meta);
      this.historyEl.appendChild(item);
    });
  }

  async roll() {
    if (this.rolling) {
      return;
    }

    let request;
    try {
      request = RollParser.parse(this.formula.value);
    } catch (error) {
      this.writeStatus(error.message, "error");
      if (typeof this.setGlobalStatus === "function") {
        this.setGlobalStatus(error.message, "error");
      }
      return;
    }

    this.settings.notation = request.notation;
    this.persistSettings();
    this.hasRolled = true;
    this.stopIdleRenderLoop();
    this.renderer?.setIdlePreviewVisible(false);
    this.rolling = true;
    this.rollButton.disabled = true;
    this.writeStatus("Rolling...", "neutral");

    try {
      if (!this.canUse3D()) {
        await this.runFallback(request, "2D fallback forced by debug toggle.");
        return;
      }

      const ready = await this.ensure3DEngine();
      if (!ready || !this.renderer || !this.physics || !this.templates) {
        await this.runFallback(request, "3D engine unavailable, using 2D fallback.");
        return;
      }

      this.renderer.mark3DActive(true);
      this.physics.clearDynamicBodies();
      this.renderer.clearDice();

      const expanded = this.expandRequest(request);
      const records = [];

      for (let index = 0; index < expanded.length; index += 1) {
        const spec = expanded[index];
        const template = this.templates[spec.kind];
        if (!template) {
          continue;
        }
        const body = this.physics.spawnDie(template, index);
        const built = this.renderer.buildMesh(spec.kind, DICE_MODES.PROCEDURAL, template);
        this.renderer.addMesh(body, built.mesh);
        records.push({ body, template, spec });
      }

      await new Promise((resolve) => {
        const startedAt = performance.now();
        let previous = startedAt;
        let settledFrames = 0;

        const tick = (now) => {
          const dt = Math.min(0.05, Math.max(1 / 300, (now - previous) / 1000));
          previous = now;
          this.physics.step(dt);
          this.renderer.syncAllBodies(records);

          if (this.panel.dataset.collapsed !== "true") {
            this.renderer.render();
          }

          if (this.physics.isSettled()) {
            settledFrames += 1;
          } else {
            settledFrames = 0;
          }

          const timedOut = now - startedAt > DICE_SETTLE_TIMEOUT_MS;
          if (settledFrames >= DICE_SETTLE_FRAMES || timedOut) {
            if (timedOut) {
              this.writeStatus("Roll timeout reached; resolved with current orientation.", "warn");
            }
            resolve();
            return;
          }
          this.animationFrame = requestAnimationFrame(tick);
        };

        this.animationFrame = requestAnimationFrame(tick);
      });

      const result = this.resolveFromRecords(request, records);
      this.commitResult(result, `Rolled ${result.notation} = ${result.total}`);
    } catch (_error) {
      await this.runFallback(request, "3D simulation error, using 2D fallback.");
    } finally {
      this.rolling = false;
      this.rollButton.disabled = false;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      }
    }
  }
}

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
  powersCastCard: document.getElementById("powers-cast-card"),
  powersKnownCounter: document.getElementById("powers-known-counter"),
  powersCastCounter: document.getElementById("powers-cast-counter"),
  powersCastDisplay: document.getElementById("powers-cast-display"),
  knownPowersList: document.getElementById("known-powers-list"),
  addKnownPower: document.getElementById("add-known-power"),
  dicePanel: document.getElementById("dice-panel"),
  diceToggle: document.getElementById("dice-toggle"),
  dicePanelBody: document.getElementById("dice-panel-body"),
  diceCanvas: document.getElementById("dice-canvas"),
  diceFallback: document.getElementById("dice-fallback"),
  diceFormula: document.getElementById("dice-formula"),
  diceRollBtn: document.getElementById("dice-roll-btn"),
  diceHistory: document.getElementById("dice-history"),
  diceAdvanced: document.getElementById("dice-advanced"),
  diceForce2d: document.getElementById("dice-force-2d"),
  diceStatus: document.getElementById("dice-status"),
  fields: Object.fromEntries(FIELD_IDS.map((id) => [id, document.getElementById(id)])),
};

function ensureThemeToggleButton() {
  const actions = document.querySelector(".header-actions");
  if (!actions) {
    return;
  }

  const button = els.themeToggle || document.createElement("button");
  button.id = "theme-toggle";
  button.className = "btn btn-ghost theme-toggle";
  button.type = "button";
  button.setAttribute("aria-pressed", "true");
  button.setAttribute("aria-label", "Switch theme");
  button.title = "Switch theme";
  if (!button.textContent.trim()) {
    button.textContent = "Devil";
  }
  const importButton = document.getElementById("import-character");
  if (importButton && importButton.parentElement === actions) {
    if (importButton.nextElementSibling !== button) {
      actions.insertBefore(button, importButton.nextElementSibling);
    }
  } else if (button.parentElement !== actions) {
    actions.appendChild(button);
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
    els.themeToggle.textContent = darkOn ? "Devil" : "Saint";
    els.themeToggle.setAttribute("aria-pressed", String(darkOn));
    const targetLabel = darkOn ? "Switch to Saint mode" : "Switch to Devil mode";
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
        marksFieldId: "powersCastMarks",
        max: POWER_TRACKER_LENGTH,
        showMax: true,
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

function applyPowerTrackerSkin(target, count) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
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
  const max = typeof tracker.max === "number" ? tracker.max : POWER_TRACKER_LENGTH;
  const source = els.fields[tracker.fieldId];
  return clamp(Math.trunc(toSafeNumber(source?.value, 0)), 0, max);
}

function setPowerTrackerValue(target, count) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return 0;
  }
  const max = typeof tracker.max === "number" ? tracker.max : POWER_TRACKER_LENGTH;
  const safe = clamp(Math.trunc(toSafeNumber(count, 0)), 0, max);

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
    tracker.counter.textContent = tracker.showMax ? `${safe} / ${max}` : String(safe);
  }
  applyPowerTrackerSkin(target, safe);
  return safe;
}

function trackerCountFromCharacter(character, target) {
  const tracker = trackerDescriptor(target);
  if (!tracker) {
    return 0;
  }
  const max = typeof tracker.max === "number" ? tracker.max : POWER_TRACKER_LENGTH;

  if (target === "known") {
    const fromList = parseKnownPowersText(character?.powersKnown).length;
    if (fromList > 0) {
      return clamp(fromList, 0, max);
    }
  }

  const hasStoredMarks = tracker.marksFieldId
    ? String(character[tracker.marksFieldId] ?? "").trim() !== ""
    : false;
  if (tracker.marksFieldId && hasStoredMarks) {
    return countMarked(normalizePowerMarks(character[tracker.marksFieldId]));
  }
  return clamp(Math.trunc(toSafeNumber(character[tracker.fieldId], 0)), 0, max);
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
  const next = clamp(current + delta, 0, POWER_TRACKER_LENGTH);
  setPowerTrackerValue(target, next);

  if (delta > 0 && next > current) {
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
    `${target === "known" ? "Known powers" : "Cast attempts"}: ${next}/${POWER_TRACKER_LENGTH}.`,
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
  merged.powersCastToday = clamp(Math.trunc(merged.powersCastToday), 0, POWER_TRACKER_LENGTH);
  merged.sacredScrolls = clamp(Math.trunc(merged.sacredScrolls), 0, 99);
  merged.uncleanScrolls = clamp(Math.trunc(merged.uncleanScrolls), 0, 99);
  merged.powersKnownMarks = normalizePowerMarks(merged.powersKnownMarks);
  merged.powersCastMarks = normalizePowerMarks(merged.powersCastMarks);
  if (!candidate || !candidate.powersCastMarks) {
    merged.powersCastMarks = `${"1".repeat(
      clamp(merged.powersCastToday, 0, POWER_TRACKER_LENGTH)
    )}${"0".repeat(
      POWER_TRACKER_LENGTH - clamp(merged.powersCastToday, 0, POWER_TRACKER_LENGTH)
    )}`;
  }
  const knownFromList = parseKnownPowersText(merged.powersKnown).length;
  if (knownFromList > 0) {
    merged.powersKnownCount = clamp(knownFromList, 0, KNOWN_POWERS_MAX);
  } else if (candidate && String(candidate.powersKnownMarks ?? "").trim() !== "") {
    merged.powersKnownCount = clamp(countMarked(merged.powersKnownMarks), 0, KNOWN_POWERS_MAX);
  }
  merged.powersCastToday = countMarked(merged.powersCastMarks);
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
  const base = activeCharacter() || createBlankCharacter();
  const randomized = normalizeCharacter({
    ...base,
    ...randomCharacterPatch(),
    updatedAt: nowIso(),
  });
  upsertCharacter(randomized, false);
  applyToForm(randomized);
  setStatus("Generated a classless adventurer from core tables.", "ok");
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

function clampFieldValue(fieldId, min, max) {
  const field = els.fields[fieldId];
  if (!field || field.value === "") {
    return;
  }
  const value = toSafeNumber(field.value, min);
  field.value = clamp(Math.trunc(value), min, max);
}

function bindEvents() {
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
      const hpMax = Math.max(1, toSafeNumber(els.fields.hpMax.value, 1));
      els.fields.hpMax.value = hpMax;
      if (toSafeNumber(els.fields.hpCurrent.value, 0) > hpMax) {
        els.fields.hpCurrent.value = hpMax;
      }
    }
    if (event.target.id === "hpCurrent") {
      const hpMax = Math.max(1, toSafeNumber(els.fields.hpMax.value, 1));
      const hpCurrent = clamp(toSafeNumber(els.fields.hpCurrent.value, 0), 0, hpMax);
      els.fields.hpCurrent.value = hpCurrent;
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
      clampFieldValue("powersCastToday", 0, POWER_TRACKER_LENGTH);
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
  loadState();
  renderCharacterList();
  applyToForm(activeCharacter());
  state.diceTray = new DiceTrayController({
    setGlobalStatus: setStatus,
    panel: els.dicePanel,
    toggle: els.diceToggle,
    body: els.dicePanelBody,
    formula: els.diceFormula,
    rollButton: els.diceRollBtn,
    history: els.diceHistory,
    advanced: els.diceAdvanced,
    force2d: els.diceForce2d,
    canvas: els.diceCanvas,
    fallback: els.diceFallback,
    status: els.diceStatus,
    root: els.dicePanel,
  });
  state.diceTray.init();
  bindEvents();
  setStatus("Ready. Autosave is local and randomize uses classless core rules.", "ok");
}

init();

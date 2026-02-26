(function () {
  "use strict";

  function nowIso() {
    return new Date().toISOString();
  }

const DICE_SETTINGS_KEY = "mb_dice_settings_v1";
const DICE_HISTORY_KEY = "mb_dice_history_v1";
const DICE_HISTORY_LIMIT = 10;
const DICE_MAX_FORMULA_LENGTH = 72;
const DICE_MAX_DICE_PER_ROLL = 40;
const DICE_SETTLE_FRAMES = 26;
const DICE_SETTLE_TIMEOUT_MS = 12000;
const DICE_SETTLE_LINEAR = 0.06;
const DICE_SETTLE_ANGULAR = 0.1;
const DICE_VIEWPORT_EDGE_PADDING = 0.9;
const DICE_PHYSICS_INNER_PADDING = 0.55;
const DICE_GLOBAL_SCALE = 1.4;
const DICE_ALLOWED_SIDES = new Set([2, 4, 6, 8, 10, 12, 20, 100]);
const DICE_MODES = Object.freeze({
  PROCEDURAL: "procedural",
  FALLBACK: "2d-fallback",
});
const DICE_MODULE_URLS = Object.freeze({
  three: "./assets/vendor/three-0.161.0.module.js",
  cannon: "./assets/vendor/cannon-es-0.20.0.module.js",
});

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
  const ringRadius = radius * 0.94;
  const poleHeight = radius * 1.05;
  // Keep each kite face close to planar so render triangulation doesn't read as extra faces.
  const ringOffset = poleHeight * 0.106;
  const step = (Math.PI * 2) / 5;
  const vertices = [];
  const quadFaces = [];

  for (let index = 0; index < 5; index += 1) {
    const angle = step * index;
    vertices.push([Math.cos(angle) * ringRadius, ringOffset, Math.sin(angle) * ringRadius]);
  }

  for (let index = 0; index < 5; index += 1) {
    const angle = step * index + step / 2;
    vertices.push([Math.cos(angle) * ringRadius, -ringOffset, Math.sin(angle) * ringRadius]);
  }

  const topIndex = vertices.length;
  vertices.push([0, poleHeight, 0]);
  const bottomIndex = vertices.length;
  vertices.push([0, -poleHeight, 0]);

  for (let index = 0; index < 5; index += 1) {
    const upper = index;
    const upperNext = (index + 1) % 5;
    const lower = 5 + index;
    const lowerPrev = 5 + ((index + 4) % 5);

    // Top set: 5 kite faces.
    quadFaces.push([topIndex, upper, lower, upperNext]);
    // Bottom set: 5 kite faces.
    quadFaces.push([bottomIndex, lower, upper, lowerPrev]);
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

  const orientedQuadFaces = quadFaces.map((face) => {
    const va = vertices[face[0]];
    const vb = vertices[face[1]];
    const vc = vertices[face[2]];
    const ab = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]];
    const ac = [vc[0] - va[0], vc[1] - va[1], vc[2] - va[2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const center = face.reduce(
      (sum, vertexIndex) => {
        const vertex = vertices[vertexIndex];
        sum[0] += vertex[0];
        sum[1] += vertex[1];
        sum[2] += vertex[2];
        return sum;
      },
      [0, 0, 0]
    );
    center[0] /= face.length;
    center[1] /= face.length;
    center[2] /= face.length;
    const out = [center[0] - centroid[0], center[1] - centroid[1], center[2] - centroid[2]];
    const dot = cross[0] * out[0] + cross[1] * out[1] + cross[2] * out[2];
    return dot < 0 ? [...face].reverse() : [...face];
  });

  const renderTriangles = [];
  orientedQuadFaces.forEach((face) => {
    for (let index = 1; index < face.length - 1; index += 1) {
      renderTriangles.push([face[0], face[index], face[index + 1]]);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices.flat(), 3)
  );
  geometry.setIndex(renderTriangles.flat());
  geometry.computeVertexNormals();
  return {
    geometry,
    convexData: {
      vertices,
      faces: orientedQuadFaces,
    },
  };
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
    .map((face) => {
      if (!Array.isArray(face) || face.length < 3) {
        return null;
      }
      const a = face[0];
      const b = face[1];
      const c = face[2];
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
      const center = face.reduce(
        (sum, vertexIndex) => {
          const vertex = convexData.vertices[vertexIndex];
          if (!vertex) {
            return sum;
          }
          sum[0] += vertex[0];
          sum[1] += vertex[1];
          sum[2] += vertex[2];
          return sum;
        },
        [0, 0, 0]
      );
      center[0] /= face.length;
      center[1] /= face.length;
      center[2] /= face.length;
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

function buildD4CornerData(convexData) {
  const ordered = convexData.vertices
    .map((vertex, index) => ({ index, vertex }))
    .sort((left, right) => {
      if (right.vertex[1] !== left.vertex[1]) {
        return right.vertex[1] - left.vertex[1];
      }
      if (right.vertex[2] !== left.vertex[2]) {
        return right.vertex[2] - left.vertex[2];
      }
      return right.vertex[0] - left.vertex[0];
    });

  const valueByIndex = new Map();
  ordered.forEach((entry, order) => {
    valueByIndex.set(entry.index, order + 1);
  });

  const cornerValues = convexData.vertices.map((vertex, index) => ({
    index,
    vertex,
    value: valueByIndex.get(index) || index + 1,
  }));

  const uniqueFaceKeys = new Set();
  const cornerFaces = [];
  convexData.faces.forEach((face) => {
    const key = [...face].sort((a, b) => a - b).join("-");
    if (uniqueFaceKeys.has(key)) {
      return;
    }
    uniqueFaceKeys.add(key);
    cornerFaces.push([...face]);
  });

  return {
    cornerValues,
    cornerFaces,
  };
}

function createDieTemplates(THREE, CANNON) {
  const templateFromGeometry = (kind, geometry, expectedFaces, options = {}) => {
    geometry.computeVertexNormals();
    const convex = options.convexData || geometryToConvexData(geometry);
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
        valueLabel: entry.valueLabel ?? entry.value,
      })),
      cornerValues: Array.isArray(options.cornerValues)
        ? options.cornerValues
            .filter((entry) => entry && entry.vertex)
            .map((entry) => {
              const vertex = Array.isArray(entry.vertex)
                ? { x: entry.vertex[0], y: entry.vertex[1], z: entry.vertex[2] }
                : { x: entry.vertex.x, y: entry.vertex.y, z: entry.vertex.z };
              return {
                index: Number.isInteger(entry.index) ? entry.index : 0,
                value: Number.isInteger(entry.value) ? entry.value : 1,
                vertex,
              };
            })
        : null,
      cornerFaces: Array.isArray(options.cornerFaces)
        ? options.cornerFaces
            .filter((face) => Array.isArray(face) && face.length === 3)
            .map((face) => face.map((index) => Math.trunc(index)))
        : null,
      mass: options.mass ?? 1,
    };
  };

  const d2Geometry = new THREE.CylinderGeometry(0.9, 0.9, 0.34, 24);
  const d4Geometry = new THREE.TetrahedronGeometry(1.2);
  const d4CornerData = buildD4CornerData(geometryToConvexData(d4Geometry));
  const d10Data = buildD10Geometry(THREE, 1.03);
  const d10FaceMap = clusterNormals(d10Data.convexData, 10).map((entry, index) => ({
    ...entry,
    value: index === 0 ? 10 : index,
    valueLabel: index,
  }));

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
    d4: templateFromGeometry("d4", d4Geometry, 4, {
      mass: 0.95,
      cornerValues: d4CornerData.cornerValues,
      cornerFaces: d4CornerData.cornerFaces,
    }),
    d6: templateFromGeometry("d6", new THREE.BoxGeometry(1.4, 1.4, 1.4), 6, { mass: 1.1 }),
    d8: templateFromGeometry("d8", new THREE.OctahedronGeometry(1.02), 8, { mass: 1 }),
    d10: templateFromGeometry("d10", d10Data.geometry, 10, {
      mass: 1.05,
      faceMap: d10FaceMap,
      convexData: d10Data.convexData,
    }),
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
    this.floorBody = null;
    this.wallBodies = [];
    this.arena = {
      centerX: 0,
      centerZ: 0,
      halfWidth: 5,
      halfDepth: 5,
    };
    this.innerPadding = DICE_PHYSICS_INNER_PADDING;
    this.boundaryConstraintsEnabled = true;

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
    if (!this.floorBody) {
      const floor = new this.CANNON.Body({
        type: this.CANNON.Body.STATIC,
        material: this.floorMaterial,
        shape: new this.CANNON.Plane(),
      });
      floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.floorBody = floor;
      this.world.addBody(floor);
    }
    this.rebuildWalls();
  }

  clearWalls() {
    this.wallBodies.forEach((body) => {
      this.world.removeBody(body);
    });
    this.wallBodies = [];
  }

  rebuildWalls() {
    this.clearWalls();
    if (!this.boundaryConstraintsEnabled) {
      return;
    }

    const thickness = 0.72;
    const wallHeight = 4.2;
    const centerX = this.arena.centerX;
    const centerZ = this.arena.centerZ;
    const halfWidth = Math.max(2.3, this.arena.halfWidth);
    const halfDepth = Math.max(2.3, this.arena.halfDepth);

    const wallSpecs = [
      {
        shape: new this.CANNON.Box(
          new this.CANNON.Vec3(halfWidth + thickness, wallHeight, thickness)
        ),
        x: centerX,
        y: wallHeight,
        z: centerZ - (halfDepth + thickness),
      },
      {
        shape: new this.CANNON.Box(
          new this.CANNON.Vec3(halfWidth + thickness, wallHeight, thickness)
        ),
        x: centerX,
        y: wallHeight,
        z: centerZ + (halfDepth + thickness),
      },
      {
        shape: new this.CANNON.Box(
          new this.CANNON.Vec3(thickness, wallHeight, halfDepth + thickness)
        ),
        x: centerX - (halfWidth + thickness),
        y: wallHeight,
        z: centerZ,
      },
      {
        shape: new this.CANNON.Box(
          new this.CANNON.Vec3(thickness, wallHeight, halfDepth + thickness)
        ),
        x: centerX + (halfWidth + thickness),
        y: wallHeight,
        z: centerZ,
      },
    ];

    wallSpecs.forEach((spec) => {
      const body = new this.CANNON.Body({
        type: this.CANNON.Body.STATIC,
        shape: spec.shape,
        material: this.floorMaterial,
      });
      body.position.set(spec.x, spec.y, spec.z);
      this.world.addBody(body);
      this.wallBodies.push(body);
    });
  }

  getInnerBounds() {
    const halfWidth = Math.max(1.8, this.arena.halfWidth - this.innerPadding);
    const halfDepth = Math.max(1.8, this.arena.halfDepth - this.innerPadding);
    return {
      minX: this.arena.centerX - halfWidth,
      maxX: this.arena.centerX + halfWidth,
      minZ: this.arena.centerZ - halfDepth,
      maxZ: this.arena.centerZ + halfDepth,
      halfWidth,
      halfDepth,
    };
  }

  setArenaBounds(bounds) {
    if (!bounds || typeof bounds !== "object") {
      return;
    }

    const minX = Number.isFinite(bounds.minX) ? bounds.minX : -5;
    const maxX = Number.isFinite(bounds.maxX) ? bounds.maxX : 5;
    const minZ = Number.isFinite(bounds.minZ) ? bounds.minZ : -5;
    const maxZ = Number.isFinite(bounds.maxZ) ? bounds.maxZ : 5;

    const width = Math.max(4.6, maxX - minX);
    const depth = Math.max(4.6, maxZ - minZ);

    this.arena = {
      centerX: Number.isFinite(bounds.centerX) ? bounds.centerX : (minX + maxX) / 2,
      centerZ: Number.isFinite(bounds.centerZ) ? bounds.centerZ : (minZ + maxZ) / 2,
      halfWidth: width / 2,
      halfDepth: depth / 2,
    };
    if (this.boundaryConstraintsEnabled) {
      this.rebuildWalls();
    } else {
      this.clearWalls();
    }
  }

  setBoundaryConstraintsEnabled(enabled) {
    const next = Boolean(enabled);
    if (this.boundaryConstraintsEnabled === next) {
      return;
    }
    this.boundaryConstraintsEnabled = next;
    if (next) {
      this.rebuildWalls();
      return;
    }
    this.clearWalls();
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
      sleepSpeedLimit: 0.06,
      sleepTimeLimit: 0.5,
      linearDamping: 0.2,
      angularDamping: 0.22,
    });
    if (template.kind === "d10") {
      body.linearDamping = 0.28;
      body.angularDamping = 0.34;
      body.sleepSpeedLimit = 0.045;
      body.sleepTimeLimit = 0.35;
    }
    body.addShape(template.createShape());

    const innerBounds = this.getInnerBounds();
    const spawnX = Math.max(1.0, innerBounds.halfWidth * 0.24);
    const spawnZ = Math.max(1.0, innerBounds.halfDepth * 0.24);
    const horizontalSpeed = Math.min(
      21.5,
      Math.max(11.8, Math.max(innerBounds.halfWidth, innerBounds.halfDepth) * 1.95)
    );
    // Use a topward arc (270° -> 90° through 0°) so throws travel up-screen with spread.
    const headingRadians = ((Math.random() * 180 - 90) * Math.PI) / 180;
    const dirX = Math.sin(headingRadians);
    const dirZ = -Math.cos(headingRadians);
    const speed = horizontalSpeed * (0.86 + Math.random() * 0.3);

    body.position.set(
      this.arena.centerX + (Math.random() - 0.5) * spawnX,
      6.8 + orderIndex * 0.24,
      this.arena.centerZ + (Math.random() - 0.5) * spawnZ
    );
    body.quaternion.setFromEuler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    body.velocity.set(
      dirX * speed,
      2.5 + Math.random() * 4.4,
      dirZ * speed
    );
    body.angularVelocity.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    );
    this.world.addBody(body);
    this.dynamicBodies.push({ body });
    return body;
  }

  constrainDynamicBodies() {
    const bounds = this.getInnerBounds();
    const bounce = 0.38;
    this.dynamicBodies.forEach((entry) => {
      const { body } = entry;
      if (body.position.x < bounds.minX) {
        body.position.x = bounds.minX;
        if (body.velocity.x < 0) {
          body.velocity.x *= -bounce;
        }
      } else if (body.position.x > bounds.maxX) {
        body.position.x = bounds.maxX;
        if (body.velocity.x > 0) {
          body.velocity.x *= -bounce;
        }
      }

      if (body.position.z < bounds.minZ) {
        body.position.z = bounds.minZ;
        if (body.velocity.z < 0) {
          body.velocity.z *= -bounce;
        }
      } else if (body.position.z > bounds.maxZ) {
        body.position.z = bounds.maxZ;
        if (body.velocity.z > 0) {
          body.velocity.z *= -bounce;
        }
      }
    });
  }

  step(dtSeconds) {
    this.world.step(1 / 60, dtSeconds, 3);
    if (this.boundaryConstraintsEnabled) {
      this.constrainDynamicBodies();
    }
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
    this.overlayCameraViewHeight = 18;
    this.previewCameraViewHeight = 8.6;
    this.cameraViewHeight = this.overlayCameraViewHeight;
    this.presentationMode = "overlay";
    this.previewScaleBoost = 1.9;
    this.groundRaycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.pickRaycaster = new THREE.Raycaster();
    this.pickPointer = new THREE.Vector2();
    this.dieScale = 1;
    this.viewportBounds = {
      minX: -5,
      maxX: 5,
      minZ: -5,
      maxZ: 5,
      centerX: 0,
      centerZ: 0,
    };
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
    this.renderer.setClearColor(0x000000, 0);
    this.updateDieScale();

    this.scene = new this.THREE.Scene();
    this.camera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 220);
    this.camera.position.set(0, 22, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

    const ambient = new this.THREE.AmbientLight(0xf2dfc8, 0.78);
    this.scene.add(ambient);

    const key = new this.THREE.DirectionalLight(0xffe8c7, 1.16);
    key.position.set(7.5, 18, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 80;
    key.shadow.camera.left = -22;
    key.shadow.camera.right = 22;
    key.shadow.camera.top = 22;
    key.shadow.camera.bottom = -22;
    this.scene.add(key);

    const fill = new this.THREE.PointLight(0x662631, 0.35, 32);
    fill.position.set(-7, 4.8, -5.2);
    this.scene.add(fill);

    const shadowFloor = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(220, 220),
      new this.THREE.ShadowMaterial({
        opacity: 0.24,
        transparent: true,
      })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -0.001;
    shadowFloor.receiveShadow = true;
    this.scene.add(shadowFloor);
    this.setupIdlePreview();

    this.resize();
    return true;
  }

  resize() {
    if (!this.renderer || !this.camera || !this.canvas) {
      return;
    }
    const previousScale = this.dieScale;
    this.updateDieScale();
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(
      2,
      Math.round(rect.width || this.canvas.clientWidth || window.innerWidth || 720)
    );
    const height = Math.max(
      2,
      Math.round(rect.height || this.canvas.clientHeight || window.innerHeight || 405)
    );
    const aspect = width / height;
    const halfHeight = this.cameraViewHeight / 2;
    const halfWidth = halfHeight * aspect;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.viewportBounds = this.computeArenaBounds();
    if (Math.abs(previousScale - this.dieScale) > 1e-4) {
      this.applyDieScaleToScene();
    }
  }

  updateDieScale() {
    this.dieScale = DICE_GLOBAL_SCALE;
  }

  setPresentationMode(mode) {
    const next = mode === "preview" ? "preview" : "overlay";
    this.presentationMode = next;
    this.cameraViewHeight =
      next === "preview" ? this.previewCameraViewHeight : this.overlayCameraViewHeight;
    this.applyDieScaleToScene();
  }

  applyDieScaleToScene() {
    if (this.idlePreviewMesh) {
      const previewScale =
        this.dieScale * (this.presentationMode === "preview" ? this.previewScaleBoost : 1);
      this.idlePreviewMesh.scale.setScalar(previewScale);
    }
    this.meshMap.forEach((mesh) => {
      mesh.scale.setScalar(this.dieScale);
    });
  }

  projectToGround(ndcX, ndcY, planeY = 0) {
    if (!this.camera || !this.groundRaycaster || !this.groundPlane) {
      return null;
    }
    const query = new this.THREE.Vector2(ndcX, ndcY);
    this.groundRaycaster.setFromCamera(query, this.camera);
    this.groundPlane.set(new this.THREE.Vector3(0, 1, 0), -planeY);
    const hit = new this.THREE.Vector3();
    if (!this.groundRaycaster.ray.intersectPlane(this.groundPlane, hit)) {
      return null;
    }
    return hit;
  }

  computeArenaBounds() {
    const intersections = [];
    const ndcValues = [-1, -0.35, 0.35, 1];
    ndcValues.forEach((ndcX) => {
      ndcValues.forEach((ndcY) => {
        const point = this.projectToGround(ndcX, ndcY, 0);
        if (point) {
          intersections.push(point);
        }
      });
    });

    if (intersections.length < 4) {
      return {
        minX: -5,
        maxX: 5,
        minZ: -5,
        maxZ: 5,
        centerX: 0,
        centerZ: 0,
      };
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    intersections.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });

    const safeMargin = DICE_VIEWPORT_EDGE_PADDING;
    minX += safeMargin;
    maxX -= safeMargin;
    minZ += safeMargin;
    maxZ -= safeMargin;

    if (!(maxX > minX) || !(maxZ > minZ)) {
      return {
        minX: -5,
        maxX: 5,
        minZ: -5,
        maxZ: 5,
        centerX: 0,
        centerZ: 0,
      };
    }

    return {
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  }

  getArenaBounds() {
    return { ...this.viewportBounds };
  }

  pickDieAtClient(clientX, clientY) {
    if (!this.camera || !this.canvas || !this.pickRaycaster || !this.pickPointer) {
      return null;
    }
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    if (ndcX < -1 || ndcX > 1 || ndcY < -1 || ndcY > 1) {
      return null;
    }

    const roots = [];
    if (this.idlePreviewMesh?.visible) {
      roots.push(this.idlePreviewMesh);
    }
    this.meshMap.forEach((mesh) => {
      if (mesh?.visible) {
        roots.push(mesh);
      }
    });
    if (roots.length === 0) {
      return null;
    }

    this.pickPointer.set(ndcX, ndcY);
    this.pickRaycaster.setFromCamera(this.pickPointer, this.camera);

    const rootSet = new Set(roots);
    const hits = this.pickRaycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (rootSet.has(node)) {
          return node;
        }
        node = node.parent;
      }
    }
    return null;
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
    canvas.width = 768;
    canvas.height = 768;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const labelText = String(label);
    const center = canvas.width / 2;
    const fontSize =
      labelText.length >= 3
        ? Math.round(canvas.width * 0.53)
        : labelText.length === 2
          ? Math.round(canvas.width * 0.67)
          : Math.round(canvas.width * 0.82);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `900 ${fontSize}px Cinzel, serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = Math.round(fontSize * (labelText.length > 1 ? 0.11 : 0.09));
    context.strokeStyle = "rgba(18, 6, 9, 0.95)";
    context.fillStyle = "rgba(255, 244, 233, 0.98)";
    context.strokeText(labelText, center, center + 6);
    context.fillText(labelText, center, center + 6);
    if (labelText === "9") {
      const underlineHalf = fontSize * 0.24;
      const underlineY = center + fontSize * 0.34;
      context.beginPath();
      context.lineCap = "round";
      context.lineWidth = Math.max(14, Math.round(fontSize * 0.095));
      context.strokeStyle = "rgba(18, 6, 9, 0.95)";
      context.moveTo(center - underlineHalf, underlineY);
      context.lineTo(center + underlineHalf, underlineY);
      context.stroke();

      context.beginPath();
      context.lineCap = "round";
      context.lineWidth = Math.max(8, Math.round(fontSize * 0.05));
      context.strokeStyle = "rgba(255, 244, 233, 0.98)";
      context.moveTo(center - underlineHalf, underlineY);
      context.lineTo(center + underlineHalf, underlineY);
      context.stroke();
    }

    const texture = new this.THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.minFilter = this.THREE.LinearFilter;
    texture.magFilter = this.THREE.LinearFilter;
    texture.anisotropy = this.renderer?.capabilities?.getMaxAnisotropy?.() || 1;
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
        transparent: false,
        side: this.THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
        alphaTest: 0.01,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
    );
    mesh.scale.set(size, size, size);
    mesh.renderOrder = 3;
    return mesh;
  }

  addD4CornerLabels(mesh, template) {
    if (!Array.isArray(template.cornerValues) || !Array.isArray(template.cornerFaces)) {
      return false;
    }

    const cornerMap = new Map();
    template.cornerValues.forEach((corner) => {
      if (!corner || !corner.vertex) {
        return;
      }
      const vertex = new this.THREE.Vector3(corner.vertex.x, corner.vertex.y, corner.vertex.z);
      cornerMap.set(corner.index, {
        value: corner.value,
        vertex,
      });
    });
    if (cornerMap.size < 4) {
      return false;
    }

    if (!template.geometry.boundingSphere) {
      template.geometry.computeBoundingSphere();
    }
    const radius = template.geometry.boundingSphere?.radius || 1;
    const labelSize = 0.5667 * radius;
    const inset = 0.48;
    const surfaceNudge = radius * 0.04;
    const zAxis = new this.THREE.Vector3(0, 0, 1);
    const yAxis = new this.THREE.Vector3(0, 1, 0);
    const baseQuat = new this.THREE.Quaternion();
    const twistQuat = new this.THREE.Quaternion();
    const currentUp = new this.THREE.Vector3();
    const cornerUp = new this.THREE.Vector3();
    const cross = new this.THREE.Vector3();

    template.cornerFaces.forEach((face) => {
      const first = cornerMap.get(face[0]);
      const second = cornerMap.get(face[1]);
      const third = cornerMap.get(face[2]);
      if (!first || !second || !third) {
        return;
      }

      const va = first.vertex.clone();
      const vb = second.vertex.clone();
      const vc = third.vertex.clone();
      const center = va.clone().add(vb).add(vc).multiplyScalar(1 / 3);
      const normal = vb
        .clone()
        .sub(va)
        .cross(vc.clone().sub(va));
      if (normal.lengthSq() < 1e-8) {
        return;
      }
      normal.normalize();
      if (normal.dot(center) < 0) {
        normal.multiplyScalar(-1);
      }

      [first, second, third].forEach((corner) => {
        const label = this.createFaceLabelMesh(String(corner.value), labelSize);
        if (!label) {
          return;
        }
        const surfacePosition = corner.vertex.clone().lerp(center, inset);
        const position = surfacePosition.clone().addScaledVector(normal, surfaceNudge);
        label.position.copy(position);
        baseQuat.setFromUnitVectors(zAxis, normal);

        currentUp.copy(yAxis).applyQuaternion(baseQuat).normalize();
        cornerUp.copy(corner.vertex).sub(surfacePosition);
        cornerUp.addScaledVector(normal, -cornerUp.dot(normal));

        if (cornerUp.lengthSq() > 1e-8) {
          cornerUp.normalize();
          const sin = normal.dot(cross.copy(currentUp).cross(cornerUp));
          const cos = Math.max(-1, Math.min(1, currentUp.dot(cornerUp)));
          const angle = Math.atan2(sin, cos);
          twistQuat.setFromAxisAngle(normal, angle);
          label.quaternion.copy(baseQuat).premultiply(twistQuat);
        } else {
          label.quaternion.copy(baseQuat);
        }
        mesh.add(label);
      });
    });

    return true;
  }

  addFaceLabels(mesh, template) {
    if (!template?.faceMap?.length) {
      return;
    }

    if (template.kind === "d4" && this.addD4CornerLabels(mesh, template)) {
      return;
    }

    const sortedFaces = [...template.faceMap].sort((left, right) => left.value - right.value);
    if (!template.geometry.boundingSphere) {
      template.geometry.computeBoundingSphere();
    }
    const radius = template.geometry.boundingSphere?.radius || 1;
    const scaleMap = {
      d2: 0.8,
      d4: 1.34,
      d6: 0.74,
      d8: 0.66,
      d10: 0.67,
      d12: 0.78,
      d20: 0.58,
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
    const surfaceNudge = radius * 0.038;
    const zAxis = new this.THREE.Vector3(0, 0, 1);

    sortedFaces.forEach((entry, index) => {
      const label = this.createFaceLabelMesh(String(entry.valueLabel ?? entry.value), labelSize);
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

  createFallbackPreviewDie() {
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
    preview.position.set(0, 1.14, 0);

    const edges = new this.THREE.LineSegments(
      new this.THREE.EdgesGeometry(preview.geometry),
      new this.THREE.LineBasicMaterial({
        color: 0x3d1117,
        transparent: true,
        opacity: 0.8,
      })
    );
    preview.add(edges);
    preview.scale.setScalar(1);
    return preview;
  }

  setupIdlePreview() {
    this.setIdlePreviewTemplate([]);
  }

  setIdlePreviewMesh(mesh) {
    if (this.idlePreviewMesh) {
      this.scene.remove(this.idlePreviewMesh);
    }
    this.idlePreviewMesh = mesh;
    if (this.idlePreviewMesh) {
      this.scene.add(this.idlePreviewMesh);
    }
    this.applyDieScaleToScene();
  }

  setIdlePreviewTemplate(templateOrTemplates) {
    const templateList = Array.isArray(templateOrTemplates)
      ? templateOrTemplates.filter(Boolean)
      : templateOrTemplates
        ? [templateOrTemplates]
        : [];

    const root = new this.THREE.Group();
    if (templateList.length === 0) {
      root.add(this.createFallbackPreviewDie());
      this.setIdlePreviewMesh(root);
      return;
    }

    const spread = templateList.length > 1 ? 2.15 : 0;
    templateList.forEach((template, index) => {
      const built = this.buildMesh(template.kind, DICE_MODES.PROCEDURAL, template);
      const preview = built.mesh;
      preview.castShadow = true;
      preview.receiveShadow = true;
      preview.rotation.set(0, 0, 0);
      preview.scale.setScalar(1);

      const xOffset = (index - (templateList.length - 1) / 2) * spread;
      const zOffset = 0;
      preview.position.set(xOffset, 1.14, zOffset);
      root.add(preview);
    });

    this.setIdlePreviewMesh(root);
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
        side: this.THREE.FrontSide,
      })
    );
    base.castShadow = true;
    base.receiveShadow = true;
    base.scale.setScalar(this.dieScale);

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
    this.previewHost = params.previewHost;
    this.previewCanvas = params.previewCanvas;
    this.rollButton = params.rollButton;
    this.clearButton = params.clearButton;
    this.historyEl = params.history;
    this.purgeButton = params.purgeButton;
    this.advanced = params.advanced;
    this.force2d = params.force2d;
    this.lowPerformance = params.lowPerformance;
    this.canvas = params.canvas;
    this.overlay = params.overlay;
    this.fallback = params.fallback;
    this.status = params.status;
    this.root = params.root;

    this.settings = {
      notation: "d20",
      force2d: false,
      lowPerformance: false,
    };
    this.history = [];
    this.modules = null;
    this.renderer = null;
    this.previewRenderer = null;
    this.physics = null;
    this.templates = null;
    this.rolling = false;
    this.animationFrame = 0;
    this.idleFrame = 0;
    this.loadPromise = null;
    this.rollCompletionResolver = null;
    this.rollCancelRequested = false;
    this.pendingAction = null;
    this.hasRolled = false;
    this.activeRecords = [];
    this.canvasMode = "hidden";
    this.previewTemplateKey = "";
    this.onScenePointerDown = null;
    this.onSceneClick = null;
    this.pendingDieClickBlock = false;
    this.chipButtons = [];

    this.onResize = () => {
      if (this.renderer) {
        this.renderer.resize();
        if (this.physics) {
          this.physics.setArenaBounds(this.renderer.getArenaBounds());
        }
        this.renderer.render();
      }
      if (this.previewRenderer) {
        this.previewRenderer.resize();
        this.previewRenderer.render();
      }
    };
  }

  init() {
    if (!this.panel || !this.toggle || !this.body || !this.rollButton) {
      return;
    }

    const storedSettings = readJsonStorage(DICE_SETTINGS_KEY, null);
    if (storedSettings && typeof storedSettings === "object") {
      this.settings.notation =
        typeof storedSettings.notation === "string" && storedSettings.notation.trim()
          ? storedSettings.notation.slice(0, DICE_MAX_FORMULA_LENGTH)
          : this.settings.notation;
      this.settings.force2d = Boolean(storedSettings.force2d);
      this.settings.lowPerformance = Boolean(storedSettings.lowPerformance);
    }

    const storedHistory = readJsonStorage(DICE_HISTORY_KEY, []);
    if (Array.isArray(storedHistory)) {
      this.history = storedHistory
        .filter((entry) => entry && typeof entry === "object")
        .slice(0, DICE_HISTORY_LIMIT);
    }
    this.chipButtons = this.root
      ? Array.from(this.root.querySelectorAll("[data-dice-chip]"))
      : [];
    this.settings.notation = this.normalizeChipNotation(this.settings.notation);
    this.refreshChipStates();
    this.updateRollButtonLabel();
    if (this.force2d) {
      this.force2d.checked = this.settings.force2d;
    }
    if (this.lowPerformance) {
      this.lowPerformance.checked = this.settings.lowPerformance;
    }
    if (this.advanced) {
      this.advanced.open = false;
    }

    this.panel.dataset.collapsed = "true";
    this.body.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    this.setCanvasMode("hidden");
    this.setPreviewCanvasVisible(false);
    if (this.fallback) {
      this.fallback.hidden = true;
      this.fallback.innerHTML = "";
    }
    this.renderHistory();
    this.writeStatus(this.settings.force2d ? "2D fallback enabled." : "Dice tray ready.", "neutral");
    this.bindEvents();
    this.updateControlAvailability();
  }

  previewTemplatesFromNotation(notation) {
    let request;
    try {
      request = RollParser.parse(notation);
    } catch (_error) {
      return null;
    }
    const firstTerm = request.terms.find((term) => term.count > 0);
    if (!firstTerm) {
      return null;
    }
    if (!this.templates) {
      return null;
    }
    if (firstTerm.sides === 100) {
      return this.templates.d10 ? [this.templates.d10, this.templates.d10] : null;
    }
    const kind = `d${firstTerm.sides}`;
    return this.templates[kind] ? [this.templates[kind]] : null;
  }

  normalizeChipNotation(notation) {
    const fallback = "d20";
    let parsed;
    try {
      parsed = RollParser.parse(notation);
    } catch (_error) {
      return fallback;
    }
    const firstTerm = parsed.terms.find((term) => term.count > 0 && term.sign > 0);
    if (!firstTerm) {
      return fallback;
    }
    const candidate = `d${firstTerm.sides}`;
    const hasCandidateChip = this.chipButtons.some(
      (chip) => String(chip.dataset.diceChip || "").trim().toLowerCase() === candidate
    );
    return hasCandidateChip ? candidate : fallback;
  }

  refreshChipStates() {
    const active = String(this.settings.notation || "").trim().toLowerCase();
    this.chipButtons.forEach((chip) => {
      const value = String(chip.dataset.diceChip || "").trim().toLowerCase();
      const isActive = value === active;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  updateRollButtonLabel() {
    if (!this.rollButton) {
      return;
    }
    const notation = this.normalizeChipNotation(this.settings.notation);
    this.rollButton.textContent = `Roll ${notation}`;
  }

  setCanvasMode(mode) {
    if (!this.canvas) {
      return;
    }
    const next = mode === "overlay" ? "overlay" : "hidden";
    this.canvasMode = next;

    if (next === "overlay") {
      if (this.overlay && this.canvas.parentElement !== this.overlay) {
        this.overlay.appendChild(this.canvas);
      }
      this.canvas.classList.remove("is-preview");
      this.canvas.hidden = false;
      if (this.fallback) {
        this.fallback.hidden = true;
      }
      return;
    }

    this.canvas.classList.remove("is-preview");
    this.canvas.hidden = true;
  }

  setPreviewCanvasVisible(isVisible) {
    if (this.previewCanvas) {
      this.previewCanvas.hidden = !isVisible;
    }
    if (this.previewHost) {
      this.previewHost.setAttribute("aria-hidden", isVisible ? "false" : "true");
    }
  }

  preparePreviewCanvas() {
    if (!this.canUse3D() || !this.previewRenderer) {
      this.setPreviewCanvasVisible(false);
      return;
    }
    this.previewRenderer.setPresentationMode("preview");
    this.previewRenderer.resize();
    this.setPreviewCanvasVisible(true);
    if (this.fallback) {
      this.fallback.hidden = true;
    }
  }

  prepareOverlayCanvas() {
    if (!this.canUse3D()) {
      this.setCanvasMode("hidden");
      return;
    }
    this.renderer?.setPresentationMode("overlay");
    this.renderer?.setIdlePreviewVisible(false);
    this.setCanvasMode("overlay");
    if (this.renderer) {
      this.renderer.resize();
      if (this.physics) {
        this.physics.setArenaBounds(this.renderer.getArenaBounds());
      }
    }
  }

  clearRenderedDice({ returnToPreview = true } = {}) {
    this.activeRecords = [];
    this.physics?.clearDynamicBodies();
    this.renderer?.clearDice();
    if (this.fallback) {
      this.fallback.hidden = true;
      this.fallback.innerHTML = "";
    }
    this.hasRolled = false;
    if (returnToPreview && this.panel?.dataset.collapsed === "false" && this.canUse3D()) {
      this.preparePreviewCanvas();
      this.previewRenderer?.setIdlePreviewVisible(true);
      this.startIdleRenderLoop();
      this.previewRenderer?.render();
      return;
    }
    this.stopIdleRenderLoop();
    this.previewRenderer?.setIdlePreviewVisible(false);
    this.setPreviewCanvasVisible(false);
    this.setCanvasMode("hidden");
  }

  async throwDiceOffScreenAndClear(options = {}) {
    const {
      silent = false,
      returnToPreview = true,
      allowDuringLowPerformance = false,
    } = options;
    if (this.rolling) {
      if (this.settings.lowPerformance && !allowDuringLowPerformance) {
        if (!silent) {
          this.writeStatus("Roll in progress.", "warn");
        }
        return;
      }
      this.pendingAction = {
        type: "clear",
        options: { silent, returnToPreview, allowDuringLowPerformance },
      };
      this.interruptActiveRoll();
      return;
    }

    if (this.activeRecords.length === 0) {
      this.clearRenderedDice({ returnToPreview });
      if (!silent) {
        this.writeStatus("No rolled dice to clear.", "neutral");
      }
      return;
    }

    this.stopIdleRenderLoop();
    this.previewRenderer?.setIdlePreviewVisible(false);
    this.prepareOverlayCanvas();
    this.renderer?.mark3DActive(true);
    this.physics?.setBoundaryConstraintsEnabled(false);

    const viewportBounds = this.renderer?.getArenaBounds() || {
      minX: -5,
      maxX: 5,
      minZ: -5,
      maxZ: 5,
      centerX: 0,
      centerZ: 0,
    };
    const centerX =
      Number.isFinite(viewportBounds.centerX)
        ? viewportBounds.centerX
        : (viewportBounds.minX + viewportBounds.maxX) / 2;
    const centerZ =
      Number.isFinite(viewportBounds.centerZ)
        ? viewportBounds.centerZ
        : (viewportBounds.minZ + viewportBounds.maxZ) / 2;

    this.activeRecords.forEach((record) => {
      const body = record?.body;
      if (!body) {
        return;
      }
      const outwardAngle =
        Math.atan2(body.position.z - centerZ, body.position.x - centerX) +
        (Math.random() - 0.5) * 0.52;
      const horizontal = 30 + Math.random() * 16;
      body.velocity.set(
        Math.cos(outwardAngle) * horizontal,
        5 + Math.random() * 3.5,
        Math.sin(outwardAngle) * horizontal
      );
      body.angularVelocity.set(
        (Math.random() - 0.5) * 68,
        (Math.random() - 0.5) * 68,
        (Math.random() - 0.5) * 68
      );
    });

    await new Promise((resolve) => {
      const startedAt = performance.now();
      let previous = startedAt;
      const outsidePadding = 2.2;
      const outsideViewport = (body) => {
        return (
          body.position.x < viewportBounds.minX - outsidePadding ||
          body.position.x > viewportBounds.maxX + outsidePadding ||
          body.position.z < viewportBounds.minZ - outsidePadding ||
          body.position.z > viewportBounds.maxZ + outsidePadding
        );
      };
      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(1 / 300, (now - previous) / 1000));
        previous = now;
        this.physics?.step(dt);
        this.renderer?.syncAllBodies(this.activeRecords);
        this.renderer?.render();
        const elapsed = now - startedAt;
        const allOutside =
          this.activeRecords.length > 0 &&
          this.activeRecords.every((record) => record?.body && outsideViewport(record.body));
        if ((allOutside && elapsed > 300) || elapsed >= 5200) {
          resolve();
          return;
        }
        this.animationFrame = requestAnimationFrame(tick);
      };
      this.animationFrame = requestAnimationFrame(tick);
    });

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.physics?.setBoundaryConstraintsEnabled(true);
    if (this.physics && this.renderer) {
      this.physics.setArenaBounds(this.renderer.getArenaBounds());
    }

    this.clearRenderedDice({ returnToPreview });
    if (!silent) {
      this.writeStatus("Rolled dice cleared.", "neutral");
    }
  }

  purgeHistoryWithFx() {
    this.history = [];
    this.persistHistory();
    this.renderHistory();
    this.writeStatus("Roll ledger purged.", "warn");
    if (this.purgeButton) {
      this.purgeButton.classList.remove("is-pressed");
      void this.purgeButton.offsetWidth;
      this.purgeButton.classList.add("is-pressed");
      window.setTimeout(() => {
        this.purgeButton?.classList.remove("is-pressed");
      }, 180);
    }
  }

  setActiveNotation(notation, persist = true) {
    const previous = this.normalizeChipNotation(this.settings.notation);
    const next = this.normalizeChipNotation(notation);
    this.settings.notation = next;
    if (persist) {
      this.persistSettings();
    }
    this.refreshChipStates();
    this.updateRollButtonLabel();
    this.updateIdlePreviewFromNotation(next, {
      forceTemplateRefresh: previous !== next,
    });
    return next;
  }

  updateIdlePreviewFromNotation(notation, options = {}) {
    if (!this.previewRenderer || !this.templates) {
      return;
    }
    const normalized = this.normalizeChipNotation(notation || this.settings.notation);
    const shouldRefreshTemplate =
      Boolean(options.forceTemplateRefresh) || this.previewTemplateKey !== normalized;
    if (shouldRefreshTemplate) {
      const templates =
        this.previewTemplatesFromNotation(normalized) ||
        this.previewTemplatesFromNotation(this.settings.notation) ||
        (this.templates.d20 ? [this.templates.d20] : []);
      this.previewRenderer.setIdlePreviewTemplate(templates);
      this.previewTemplateKey = normalized;
    }
    if (!this.canUse3D()) {
      this.stopIdleRenderLoop();
      this.previewRenderer.setIdlePreviewVisible(false);
      this.setPreviewCanvasVisible(false);
      return;
    }
    if (this.panel.dataset.collapsed === "true") {
      this.previewRenderer.setIdlePreviewVisible(false);
      this.setPreviewCanvasVisible(false);
      return;
    }
    const lowPerformanceBlocked =
      this.settings.lowPerformance &&
      (this.rolling || (this.activeRecords.length > 0 && this.hasRolled));
    if (lowPerformanceBlocked) {
      this.stopIdleRenderLoop();
      this.previewRenderer.setIdlePreviewVisible(false);
      this.setPreviewCanvasVisible(false);
      this.previewRenderer.render();
      return;
    }
    this.preparePreviewCanvas();
    this.previewRenderer.setIdlePreviewVisible(true);
    this.startIdleRenderLoop();
    this.previewRenderer.render();
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
            if (!ready || !this.renderer) {
              return;
            }
            this.renderer.mark3DActive(true);
            this.updateIdlePreviewFromNotation(this.settings.notation);
          });
        } else {
          this.showFallbackIdle("2D fallback enabled.", "neutral");
        }
      } else {
        this.stopIdleRenderLoop();
        this.previewRenderer?.setIdlePreviewVisible(false);
        this.setPreviewCanvasVisible(false);
        this.throwDiceOffScreenAndClear({
          silent: true,
          returnToPreview: false,
          allowDuringLowPerformance: true,
        });
      }
    });

    this.rollButton.addEventListener("click", () => {
      this.roll();
    });
    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        this.throwDiceOffScreenAndClear();
      });
    }
    if (this.purgeButton) {
      this.purgeButton.addEventListener("click", () => {
        this.purgeHistoryWithFx();
      });
    }

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
        const activeNotation = this.setActiveNotation(value, true);
        if (!this.rolling) {
          this.writeStatus(`Ready to roll ${activeNotation}.`, "neutral");
        }
      });
    }

    if (this.force2d) {
      this.force2d.addEventListener("change", () => {
        this.settings.force2d = Boolean(this.force2d.checked);
        this.persistSettings();
        if (this.settings.force2d) {
          this.stopIdleRenderLoop();
          this.previewRenderer?.setIdlePreviewVisible(false);
          this.setPreviewCanvasVisible(false);
          if (this.panel.dataset.collapsed === "false") {
            this.showFallbackIdle("2D fallback enabled.", "neutral");
          } else if (this.canvas && this.fallback) {
            this.setCanvasMode("hidden");
            this.fallback.hidden = true;
            this.fallback.innerHTML = "";
            this.writeStatus("2D fallback enabled.", "neutral");
          }
        } else {
          if (this.fallback) {
            this.fallback.hidden = true;
            this.fallback.innerHTML = "";
          }
          this.writeStatus("Dice tray ready.", "neutral");
          if (this.panel.dataset.collapsed === "false" && this.canUse3D()) {
            this.ensure3DEngine().then((ready) => {
              if (!ready || !this.renderer) {
                return;
              }
              this.renderer.mark3DActive(true);
              this.updateIdlePreviewFromNotation(this.settings.notation);
            });
          }
        }
      });
    }

    if (this.lowPerformance) {
      this.lowPerformance.addEventListener("change", () => {
        this.settings.lowPerformance = Boolean(this.lowPerformance.checked);
        this.persistSettings();
        this.updateControlAvailability();
        if (this.panel.dataset.collapsed !== "false") {
          return;
        }
        if (this.settings.force2d) {
          this.showFallbackIdle("2D fallback enabled.", "neutral");
          return;
        }
        if (!this.canUse3D()) {
          return;
        }
        this.ensure3DEngine().then((ready) => {
          if (!ready || !this.renderer) {
            return;
          }
          this.renderer.mark3DActive(true);
          this.updateIdlePreviewFromNotation(this.settings.notation);
        });
      });
    }

    this.onScenePointerDown = (event) => {
      if (this.rolling && this.settings.lowPerformance) {
        return;
      }
      if (this.panel?.dataset.collapsed === "true" || !this.canUse3D()) {
        return;
      }
      let picked = null;
      if (this.renderer && this.canvas && !this.canvas.hidden) {
        picked = this.renderer.pickDieAtClient(event.clientX, event.clientY);
      }
      if (!picked && this.previewRenderer && this.previewCanvas && !this.previewCanvas.hidden) {
        picked = this.previewRenderer.pickDieAtClient(event.clientX, event.clientY);
      }
      if (!picked) {
        return;
      }
      this.pendingDieClickBlock = true;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      this.roll();
    };
    window.addEventListener("pointerdown", this.onScenePointerDown, true);

    this.onSceneClick = (event) => {
      const shouldBlock = this.pendingDieClickBlock;
      this.pendingDieClickBlock = false;
      if (!shouldBlock) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("click", this.onSceneClick, true);

    window.addEventListener("resize", this.onResize);
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.stopIdleRenderLoop();
    if (this.onScenePointerDown) {
      window.removeEventListener("pointerdown", this.onScenePointerDown, true);
      this.onScenePointerDown = null;
    }
    if (this.onSceneClick) {
      window.removeEventListener("click", this.onSceneClick, true);
      this.onSceneClick = null;
    }
    this.pendingDieClickBlock = false;
    window.removeEventListener("resize", this.onResize);
  }

  startIdleRenderLoop() {
    if (this.idleFrame || !this.previewRenderer) {
      return;
    }
    if (this.panel.dataset.collapsed === "true" || !this.canUse3D()) {
      return;
    }
    const hasRolledDice = this.activeRecords.length > 0 && this.hasRolled;
    const lowPerformanceBlocked =
      this.settings.lowPerformance && (this.rolling || hasRolledDice);
    if (lowPerformanceBlocked) {
      return;
    }
    this.preparePreviewCanvas();
    this.previewRenderer.setIdlePreviewVisible(true);
    let last = performance.now();
    const tick = (now) => {
      this.idleFrame = 0;
      if (
        !this.previewRenderer ||
        this.panel.dataset.collapsed === "true" ||
        !this.canUse3D()
      ) {
        this.previewRenderer?.setIdlePreviewVisible(false);
        this.setPreviewCanvasVisible(false);
        return;
      }
      const rollingWithLowPerformance =
        this.settings.lowPerformance &&
        (this.rolling || (this.hasRolled && this.activeRecords.length > 0));
      if (rollingWithLowPerformance) {
        this.previewRenderer.setIdlePreviewVisible(false);
        this.setPreviewCanvasVisible(false);
        return;
      }
      this.setPreviewCanvasVisible(true);
      const dt = Math.min(0.05, Math.max(1 / 300, (now - last) / 1000));
      last = now;
      this.previewRenderer.animateIdlePreview(dt);
      this.previewRenderer.render();
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

  updateControlAvailability() {
    const shouldLock = this.settings.lowPerformance && this.rolling;
    if (this.rollButton) {
      this.rollButton.disabled = shouldLock;
    }
    if (this.clearButton) {
      this.clearButton.disabled = shouldLock;
    }
  }

  interruptActiveRoll() {
    if (!this.rolling) {
      return;
    }
    this.rollCancelRequested = true;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    if (typeof this.rollCompletionResolver === "function") {
      const resolve = this.rollCompletionResolver;
      this.rollCompletionResolver = null;
      resolve();
    }
  }

  flushPendingAction() {
    if (this.rolling || !this.pendingAction) {
      return;
    }
    const action = this.pendingAction;
    this.pendingAction = null;
    if (action.type === "clear") {
      this.throwDiceOffScreenAndClear(action.options || {});
      return;
    }
    if (action.type === "roll") {
      this.roll(action.notation || this.settings.notation);
    }
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
    if (this.fallback) {
      this.activeRecords = [];
      this.setCanvasMode("hidden");
      this.setPreviewCanvasVisible(false);
      if (this.previewHost) {
        this.previewHost.setAttribute("aria-hidden", "false");
      }
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
          importFirst([DICE_MODULE_URLS.three]),
          importFirst([DICE_MODULE_URLS.cannon]),
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
        this.renderer = new DiceRenderer(this.modules.THREE, this.canvas, null);
        if (!this.renderer.init()) {
          throw new Error("Renderer failed to initialize.");
        }
        this.renderer.setPresentationMode("overlay");
        this.renderer.setIdlePreviewVisible(false);

        if (this.previewCanvas) {
          this.previewRenderer = new DiceRenderer(this.modules.THREE, this.previewCanvas, null);
          if (!this.previewRenderer.init()) {
            throw new Error("Preview renderer failed to initialize.");
          }
          this.previewRenderer.setPresentationMode("preview");
          this.previewTemplateKey = "";
        } else {
          this.previewRenderer = null;
          this.previewTemplateKey = "";
        }

        const isOpen = this.panel?.dataset.collapsed === "false";
        if (isOpen) {
          this.renderer.mark3DActive(true);
          this.physics.setArenaBounds(this.renderer.getArenaBounds());
          this.updateIdlePreviewFromNotation(this.settings.notation);
        } else {
          this.previewRenderer?.setIdlePreviewVisible(false);
          this.setPreviewCanvasVisible(false);
          this.setCanvasMode("hidden");
        }
        this.renderer.render();
        this.previewRenderer?.render();
        return true;
      } catch (error) {
        this.renderer = null;
        this.previewRenderer = null;
        this.previewTemplateKey = "";
        this.physics = null;
        this.templates = null;
        this.modules = null;
        this.showFallbackIdle("3D failed to load. Using 2D fallback.", "warn");
        if (typeof this.setGlobalStatus === "function") {
          this.setGlobalStatus("3D failed to load. Using 2D fallback.", "warn");
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

  getBestFaceUp(record) {
    const { body, template } = record;
    if (!template?.faceMap?.length) {
      return { face: null, dot: Number.NEGATIVE_INFINITY };
    }

    let bestFace = template.faceMap[0] || null;
    let bestDot = Number.NEGATIVE_INFINITY;

    template.faceMap.forEach((face) => {
      const worldNormal = new this.modules.CANNON.Vec3();
      body.quaternion.vmult(face.normal, worldNormal);
      const length = Math.hypot(worldNormal.x, worldNormal.y, worldNormal.z) || 1;
      const dot = worldNormal.y / length;
      if (dot > bestDot) {
        bestDot = dot;
        bestFace = face;
      }
    });

    return { face: bestFace, dot: bestDot };
  }

  resolveFaceUp(record) {
    const { body, template } = record;

    if (template.kind === "d4" && Array.isArray(template.cornerValues) && template.cornerValues.length) {
      let cameraPosition = null;
      const camera = this.renderer?.camera || null;
      if (camera) {
        cameraPosition = new this.modules.CANNON.Vec3(
          Number.isFinite(camera.position.x) ? camera.position.x : 0,
          Number.isFinite(camera.position.y) ? camera.position.y : 0,
          Number.isFinite(camera.position.z) ? camera.position.z : 0
        );
      }

      let bestCornerValue = template.cornerValues[0]?.value ?? 1;
      let bestMetric = cameraPosition ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      template.cornerValues.forEach((corner) => {
        if (!corner?.vertex) {
          return;
        }
        const localCorner = new this.modules.CANNON.Vec3(
          corner.vertex.x,
          corner.vertex.y,
          corner.vertex.z
        );
        const worldCorner = new this.modules.CANNON.Vec3();
        body.quaternion.vmult(localCorner, worldCorner);
        worldCorner.x += body.position.x;
        worldCorner.y += body.position.y;
        worldCorner.z += body.position.z;

        let metric;
        if (cameraPosition) {
          const dx = worldCorner.x - cameraPosition.x;
          const dy = worldCorner.y - cameraPosition.y;
          const dz = worldCorner.z - cameraPosition.z;
          metric = dx * dx + dy * dy + dz * dz;
        } else {
          metric = worldCorner.y;
        }

        const isBetter = cameraPosition ? metric < bestMetric : metric > bestMetric;
        if (isBetter) {
          bestMetric = metric;
          bestCornerValue = corner.value;
        }
      });
      return bestCornerValue;
    }

    const best = this.getBestFaceUp(record);
    return best.face?.value ?? 1;
  }

  resolveFromRecords(request, records) {
    const grouped = new Map();
    const rolls = [];
    let total = request.modifier;

    records.forEach((record) => {
      const rawValue = this.resolveFaceUp(record);
      if (record.spec.groupId) {
        const existing = grouped.get(record.spec.groupId) || {
          sign: record.spec.sign,
          tens: 0,
          ones: 0,
        };
        const digit = rawValue % 10;
        if (record.spec.groupPart === "tens") {
          existing.tens = digit;
        } else {
          existing.ones = digit;
        }
        grouped.set(record.spec.groupId, existing);
        return;
      }
      const value = rawValue;
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

  async runFallback(request, warning = "") {
    const result = this.rollWithRng(request);
    const labels = result.rolls.map((entry) => entry.die);
    const values = result.rolls.map((entry) => String(entry.value));

    this.stopIdleRenderLoop();
    this.previewRenderer?.setIdlePreviewVisible(false);
    this.setPreviewCanvasVisible(false);
    this.setCanvasMode("hidden");
    if (this.fallback) {
      this.setCanvasMode("hidden");
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

    if (this.fallback) {
      const tokens = Array.from(this.fallback.querySelectorAll(".dice-fallback-token"));
      tokens.forEach((token, index) => {
        token.classList.remove("is-rolling");
        token.textContent = `${labels[index]}:${values[index]}`;
      });
    }

    const fallbackStatus = warning
      ? `${warning} Rolled ${result.notation} = ${result.total}`
      : `Rolled ${result.notation} = ${result.total}`;
    this.commitResult(result, fallbackStatus, warning ? "warn" : "neutral");
  }

  commitResult(result, statusMessage, tone = "neutral") {
    this.history.unshift(result);
    this.history = this.history.slice(0, DICE_HISTORY_LIMIT);
    this.persistHistory();
    this.renderHistory();
    this.writeStatus(statusMessage || `Rolled ${result.notation} = ${result.total}`, tone);
    if (typeof this.setGlobalStatus === "function") {
      this.setGlobalStatus(`Rolled ${result.notation} = ${result.total}.`, "ok");
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
      notation.className = "dice-history-die";
      const singleDie =
        Array.isArray(entry.rolls) && entry.rolls.length === 1
          ? entry.rolls[0]?.die
          : null;
      notation.textContent = singleDie || entry.notation || "roll";
      const total = document.createElement("span");
      total.className = "dice-history-total";
      total.textContent = String(entry.total);
      main.appendChild(notation);
      main.appendChild(total);

      item.appendChild(main);
      this.historyEl.appendChild(item);
    });
  }

  async roll(forcedNotation = null) {
    if (this.rolling) {
      if (this.settings.lowPerformance) {
        return;
      }
      this.pendingAction = {
        type: "roll",
        notation: forcedNotation || this.settings.notation,
      };
      this.interruptActiveRoll();
      return;
    }

    const CANCELLED_ERROR = "__ROLL_CANCELLED__";
    const notation = this.setActiveNotation(forcedNotation || this.settings.notation, true);
    let request;
    try {
      request = RollParser.parse(notation);
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
    this.activeRecords = [];
    if (this.settings.lowPerformance) {
      this.stopIdleRenderLoop();
      this.previewRenderer?.setIdlePreviewVisible(false);
      this.setPreviewCanvasVisible(false);
    } else if (this.panel?.dataset.collapsed === "false" && this.canUse3D()) {
      this.preparePreviewCanvas();
      this.previewRenderer?.setIdlePreviewVisible(true);
      this.startIdleRenderLoop();
      this.previewRenderer?.render();
    }
    this.rolling = true;
    this.rollCancelRequested = false;
    this.updateControlAvailability();
    this.writeStatus("Rolling...", "neutral");

    try {
      if (this.rollCancelRequested) {
        throw new Error(CANCELLED_ERROR);
      }
      if (!this.canUse3D()) {
        await this.runFallback(request);
        this.activeRecords = [];
        return;
      }

      const ready = await this.ensure3DEngine();
      if (this.rollCancelRequested) {
        throw new Error(CANCELLED_ERROR);
      }
      if (!ready || !this.renderer || !this.physics || !this.templates) {
        await this.runFallback(request, "3D failed to load. Using 2D fallback.");
        this.activeRecords = [];
        return;
      }

      this.prepareOverlayCanvas();
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
      this.activeRecords = records;

      await new Promise((resolve) => {
        const startedAt = performance.now();
        let previous = startedAt;
        let settledFrames = 0;

        const tick = (now) => {
          if (this.rollCancelRequested) {
            resolve();
            return;
          }
          const dt = Math.min(0.05, Math.max(1 / 300, (now - previous) / 1000));
          previous = now;
          this.physics.step(dt);
          this.renderer.syncAllBodies(records);

          this.renderer.render();

          if (this.physics.isSettled()) {
            settledFrames += 1;
          } else {
            settledFrames = 0;
          }

          const timedOut = now - startedAt > DICE_SETTLE_TIMEOUT_MS;
          if (settledFrames >= DICE_SETTLE_FRAMES || timedOut) {
            resolve();
            return;
          }
          this.animationFrame = requestAnimationFrame(tick);
        };

        this.rollCompletionResolver = resolve;
        this.animationFrame = requestAnimationFrame(tick);
      });
      this.rollCompletionResolver = null;
      if (this.rollCancelRequested) {
        throw new Error(CANCELLED_ERROR);
      }

      this.renderer.syncAllBodies(records);
      this.renderer.render();
      this.activeRecords = records;

      const result = this.resolveFromRecords(request, records);
      this.commitResult(result, `Rolled ${result.notation} = ${result.total}`);
    } catch (error) {
      const isCancelled = error instanceof Error && error.message === CANCELLED_ERROR;
      if (!isCancelled) {
        await this.runFallback(request);
        this.activeRecords = [];
      }
    } finally {
      this.rolling = false;
      this.rollCompletionResolver = null;
      this.rollCancelRequested = false;
      this.updateControlAvailability();
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      }
      const hasPendingAction = Boolean(this.pendingAction);
      if (
        !hasPendingAction &&
        this.panel?.dataset.collapsed === "false" &&
        this.canUse3D() &&
        this.renderer
      ) {
        this.updateIdlePreviewFromNotation(this.settings.notation);
      }
      this.flushPendingAction();
    }
  }
}


  window.MorkBorgDice = Object.freeze({
    createDiceTrayController: (params) => new DiceTrayController(params),
  });
})();

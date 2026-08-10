import { DECORATIVE_PROPS } from "../concepts/decorative/decorative-manifest.mjs";
import {
  COMPOSITION_GAPS,
  PLACEMENT_SIZE_CLASSES,
  RENDER_LAYERS,
  rectsIntersect,
  validateCompositionDensity,
} from "./visual-contract.mjs";
import { IMPLEMENTED_VISUAL_INVENTORY } from "./visual-inventory.mjs";
import { pickupYAboveSurface } from "./pickup-layout.mjs";
import {
  boundsAtWorldAnchor,
  classifyWorldObjectPlacement,
  groundedEnvelopeAt,
  PLACEMENT_TYPES,
} from "./world-placement.mjs";

const item = (x, prop, surfaceId, groundY = 468) => Object.freeze({
  x,
  prop,
  surfaceId,
  groundY,
  placementType: PLACEMENT_TYPES.ON_SURFACE,
});

// Scenery is level-specific because the same world X can be an open lawn in
// one level and the solid body of an elevated platform in another.
export const SCENERY_BY_LEVEL = Object.freeze({
  "level-1": Object.freeze([
    item(360, "bush", "ground-woodland"),
    item(2050, "bush", "ground-creek"),
    item(2912, "tree", "ground-highway"),
    item(4480, "tires", "ground-industrial"),
  ]),
  "level-2": Object.freeze([
    item(360, "bush", "backyard-lawn"),
    item(1260, "tree", "street-ground"),
    item(1940, "bush", "street-ground"),
    item(2860, "tree", "obstacle-lawn"),
    item(3760, "bin", "obstacle-lawn"),
    item(4320, "tires", "drainage-entry-lawn"),
  ]),
});

export const sceneryForLevel = (levelId) => SCENERY_BY_LEVEL[levelId] ?? Object.freeze([]);

export function sceneryVisualBounds(entry) {
  const meta = DECORATIVE_PROPS[entry.prop];
  if (!meta) throw new RangeError(`Unknown scenery prop "${entry.prop}"`);
  const w = Math.round(meta.sourceWidth * 0.5);
  const h = Math.round(meta.sourceHeight * 0.5);
  return { x: entry.x, y: entry.groundY - h, w, h };
}

const HERO_PROPS = new Set(["tree", "bin", "crate"]);

export function sceneryPlacementCategory(prop) {
  return HERO_PROPS.has(prop) ? PLACEMENT_SIZE_CLASSES.HERO : PLACEMENT_SIZE_CLASSES.MEDIUM;
}

export function sceneryCompositionBounds(entry) {
  const bounds = sceneryVisualBounds(entry);
  const placementCategory = sceneryPlacementCategory(entry.prop);
  const gap = COMPOSITION_GAPS[placementCategory];
  return {
    x: bounds.x - gap,
    y: bounds.y - Math.round(gap * 0.35),
    w: bounds.w + gap * 2,
    h: bounds.h + Math.round(gap * 0.35),
  };
}

export function compositionItemsForLevel(level) {
  const scenery = level.scenery ?? sceneryForLevel(level.id);
  return scenery.map((entry, index) => ({
    id: entry.id ?? `${level.id}:${entry.prop}:${entry.x}:${index}`,
    prop: entry.prop,
    placementCategory: sceneryPlacementCategory(entry.prop),
    bounds: sceneryVisualBounds(entry),
    compositionBounds: sceneryCompositionBounds(entry),
    placementType: entry.placementType ?? PLACEMENT_TYPES.ON_SURFACE,
    surfaceId: entry.surfaceId,
    renderLayer: "BACKGROUND_SCENERY",
  }));
}

const unionRects = (rectangles) => {
  const left = Math.min(...rectangles.map(({ x }) => x));
  const top = Math.min(...rectangles.map(({ y }) => y));
  const right = Math.max(...rectangles.map(({ x, w }) => x + w));
  const bottom = Math.max(...rectangles.map(({ y, h }) => y + h));
  return { x: left, y: top, w: right - left, h: bottom - top };
};

const expandByCompositionPadding = (bounds, contract) => ({
  x: bounds.x - contract.compositionPadding.left,
  y: bounds.y - contract.compositionPadding.top,
  w: bounds.w + contract.compositionPadding.left + contract.compositionPadding.right,
  h: bounds.h + contract.compositionPadding.top + contract.compositionPadding.bottom,
});

const inventoryRecord = (category, id) => IMPLEMENTED_VISUAL_INVENTORY.find((record) => (
  record.category === category && record.id === id
));

export function encounterCompositionItemsForLevel(level) {
  return level.encounters.filter(({ enemies }) => enemies.length > 0).map((group) => {
    const actorBounds = group.enemies.map((spawn) => {
      const record = inventoryRecord("enemy", spawn.kind);
      if (!record) throw new RangeError(`Missing enemy visual contract "${spawn.kind}"`);
      const contract = record.contract;
      if (spawn.flightBand) {
        const band = level.flightBands.find(({ id }) => id === spawn.flightBand);
        if (!band) throw new RangeError(`Missing flight band "${spawn.flightBand}"`);
        const horizontal = spawn.patrol ?? [band.startX, band.endX];
        const placement = contract.placementFootprint;
        return {
          x: Math.min(...horizontal) - placement.w / 2,
          y: band.minY,
          w: Math.max(...horizontal) - Math.min(...horizontal) + placement.w,
          h: band.maxY - band.minY,
        };
      }
      const support = level.surfaces.find(({ id }) => id === spawn.surfaceId);
      if (!support) throw new RangeError(`Missing support "${spawn.surfaceId}"`);
      const collisionWidth = contract.collisionBounds.w;
      return unionRects(spawn.patrol.flatMap((x) => [
        groundedEnvelopeAt({ x, surfaceY: support.y, collisionWidth, contract }),
      ]));
    });
    const bounds = unionRects(actorBounds);
    const gap = COMPOSITION_GAPS[group.sizeClass === "large"
      ? PLACEMENT_SIZE_CLASSES.LARGE
      : group.sizeClass === "medium"
        ? PLACEMENT_SIZE_CLASSES.MEDIUM
        : PLACEMENT_SIZE_CLASSES.SMALL];
    return {
      id: group.id,
      kind: "encounter",
      placementCategory: group.sizeClass === "large" ? PLACEMENT_SIZE_CLASSES.LARGE : PLACEMENT_SIZE_CLASSES.MEDIUM,
      spawnX: group.spawnX,
      bounds,
      compositionBounds: { x: bounds.x - gap, y: bounds.y - gap, w: bounds.w + gap * 2, h: bounds.h + gap * 2 },
    };
  });
}

export function pickupCompositionItemsForLevel(level) {
  return level.rewards.filter(({ kind }) => kind !== "checkpoint").map((reward) => {
    const record = inventoryRecord("pickup", reward.kind);
    const support = level.surfaces.find(({ id }) => id === reward.surfaceId);
    if (!record || !support) throw new RangeError(`Missing pickup contract/support for "${reward.id}"`);
    const y = pickupYAboveSurface(reward.kind, support.y, 18);
    const collisionWidth = reward.kind === "trash" ? 30 : 38;
    const bounds = boundsAtWorldAnchor(
      record.contract.placementFootprint,
      { x: reward.x + collisionWidth / 2, y: y + (reward.kind === "trash" ? 15 : 19) },
      { x: 0, y: 0 },
    );
    const hoverBounds = { x: bounds.x, y: bounds.y - 2, w: bounds.w, h: bounds.h + 4 };
    return {
      id: reward.id,
      kind: "pickup",
      placementCategory: PLACEMENT_SIZE_CLASSES.SMALL,
      bounds: hoverBounds,
      compositionBounds: expandByCompositionPadding(hoverBounds, record.contract),
      surfaceId: reward.surfaceId,
      gate: reward.gate,
    };
  });
}

export function completeCompositionItemsForLevel(level) {
  return [
    ...compositionItemsForLevel(level).map((entry) => ({ ...entry, kind: "scenery" })),
    ...pickupCompositionItemsForLevel(level),
    ...encounterCompositionItemsForLevel(level),
  ];
}

export function rollingCompositionWindows(level, viewportWidth = 960, step = 120) {
  const items = completeCompositionItemsForLevel(level);
  return Object.freeze(Array.from({ length: Math.ceil(level.worldWidth / step) }, (_, index) => {
    const x = index * step;
    const viewport = { x, y: 0, w: viewportWidth, h: 540 };
    const visibleItems = items.filter(({ compositionBounds }) => rectsIntersect(compositionBounds, viewport));
    return Object.freeze({
      x,
      viewport,
      items: Object.freeze(visibleItems),
      // Encounter pacing is owned by the center of the complete motion
      // envelope, not the authored spawn marker. Edge-grazing envelopes still
      // remain in `items` for density, overlap, and route-clearance checks.
      encounterIds: Object.freeze(items.filter(({ kind, compositionBounds }) => {
        if (kind !== "encounter") return false;
        const centerX = compositionBounds.x + compositionBounds.w / 2;
        return centerX >= x && centerX < x + viewportWidth;
      }).map(({ id }) => id)),
    });
  }));
}

export function validateRollingWorldComposition(level, viewportWidth = 960, step = 120) {
  const errors = [];
  for (let index = 0; index < level.zones.length - 1; index += 1) {
    if (level.zones[index].endX !== level.zones[index + 1].startX) {
      errors.push(`${level.id}: zone transition ${level.zones[index].id}/${level.zones[index + 1].id} is discontinuous`);
    }
  }
  const rewardIds = new Set(level.rewards.map(({ id }) => id));
  const encounterIds = new Set(level.encounters.map(({ id }) => id));
  const landingAt = (x) => level.surfaces.some((surface) => (
    !surface.hazard && x >= surface.x && x <= surface.x + surface.w
  ));
  for (const route of level.routeChoices) {
    if (!Number.isFinite(route.startX) || !Number.isFinite(route.endX)
      || route.startX < 0 || route.endX > level.worldWidth || route.startX >= route.endX) {
      errors.push(`${level.id}/${route.id}: route leaves world bounds`);
    }
    if (!landingAt(route.startX) || !landingAt(route.endX)) {
      errors.push(`${level.id}/${route.id}: missing landing target at route boundary`);
    }
    for (const rewardId of route.rewardIds) {
      const reward = level.rewards.find(({ id }) => id === rewardId);
      if (!rewardIds.has(rewardId)) errors.push(`${level.id}/${route.id}: missing route reward ${rewardId}`);
      else if (reward.x < route.startX || reward.x > route.endX) {
        errors.push(`${level.id}/${route.id}: route reward ${rewardId} is outside route`);
      }
    }
    for (const encounterId of route.bypassEncounterIds ?? []) {
      if (!encounterIds.has(encounterId)) errors.push(`${level.id}/${route.id}: missing bypass encounter ${encounterId}`);
    }
  }
  let items;
  try {
    items = completeCompositionItemsForLevel(level);
  } catch (error) {
    errors.push(`${level.id}: ${error instanceof Error ? error.message : String(error)}`);
    return errors;
  }
  for (const pickup of items.filter(({ kind }) => kind === "pickup")) {
    const support = level.surfaces.find(({ id }) => id === pickup.surfaceId);
    if (!support || pickup.bounds.x < support.x || pickup.bounds.x + pickup.bounds.w > support.x + support.w
      || pickup.bounds.y + pickup.bounds.h >= support.y || pickup.bounds.x < 0
      || pickup.bounds.x + pickup.bounds.w > level.worldWidth) {
      errors.push(`${level.id}/${pickup.id}: pickup is not reachable on ${pickup.surfaceId}`);
    }
  }
  const encounters = items.filter(({ kind }) => kind === "encounter");
  for (const route of level.routeChoices) {
    for (const encounterId of route.bypassEncounterIds ?? []) {
      const encounter = encounters.find(({ id }) => id === encounterId);
      if (encounter && (encounter.compositionBounds.x + encounter.compositionBounds.w < route.startX
        || encounter.compositionBounds.x > route.endX)) {
        errors.push(`${level.id}/${route.id}: bypass encounter ${encounterId} does not occupy route`);
      }
    }
  }
  for (const large of encounters.filter(({ id }) => level.encounters.find((group) => group.id === id)?.sizeClass === "large")) {
    for (const other of encounters.filter(({ id }) => id !== large.id)) {
      if (rectsIntersect(large.compositionBounds, other.compositionBounds)) {
        errors.push(`${level.id}/${large.id}: large encounter footprint overlaps ${other.id}`);
      }
    }
  }
  for (const scenery of items.filter(({ kind }) => kind === "scenery")) {
    if (RENDER_LAYERS[scenery.renderLayer].order >= RENDER_LAYERS.GAMEPLAY.order) {
      errors.push(`${level.id}/${scenery.id}: scenery may occlude gameplay`);
    }
  }
  for (const window of rollingCompositionWindows(level, viewportWidth, step)) {
    errors.push(...validateCompositionDensity(window.items, window.viewport).map((error) => (
      `${level.id}/${window.x}: ${error}`
    )));
    if (window.encounterIds.length > 2) {
      errors.push(`${level.id}: ${window.encounterIds.length} ordinary groups in viewport ${window.x}-${window.x + viewportWidth}`);
    }
    const heroProps = window.items.filter(({ kind, placementCategory }) => (
      kind === "scenery" && placementCategory === PLACEMENT_SIZE_CLASSES.HERO
    ));
    const repeated = heroProps.find((item, index) => heroProps.some((other, otherIndex) => (
      otherIndex > index && other.prop === item.prop
    )));
    if (repeated) errors.push(`${level.id}: repeated hero prop ${repeated.prop} in viewport ${window.x}-${window.x + viewportWidth}`);
  }
  return errors;
}

export function validateLevelComposition(level, viewportWidth = 960) {
  const errors = [];
  const items = compositionItemsForLevel(level);
  for (const item of items) {
    const placement = classifyWorldObjectPlacement(item, level.surfaces);
    if (!placement.valid) errors.push(`${item.id}: invalid platform placement`);
  }
  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      const left = items[leftIndex];
      const right = items[rightIndex];
      if (rectsIntersect(left.compositionBounds, right.compositionBounds)) {
        errors.push(`${left.id} composition overlaps ${right.id}`);
      }
    }
  }
  for (let x = 0; x < level.worldWidth; x += Math.floor(viewportWidth / 2)) {
    errors.push(...validateCompositionDensity(items, { x, y: 0, w: viewportWidth, h: 540 }));
  }
  return errors;
}

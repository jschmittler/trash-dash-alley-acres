import { levelTwoEnvironmentRecords } from "./level-two-enemies.mjs";

export const LEVEL_TWO_ENVIRONMENT_TRANSITIONS = Object.freeze([
  "entry",
  "retry",
  "checkpoint-recovery",
  "phase-change",
  "re-entry",
]);

const materializeLevelTwoEnvironment = (level) => {
  if (level?.id !== "level-2") return [];
  return [
    ...levelTwoEnvironmentRecords(),
    ...(level.boss?.hydrant
      ? [{ ...level.boss.hydrant, kind: "hydrant", encounterId: "brutus" }]
      : []),
  ];
};

export function transitionLevelTwoEnvironment(previous, level, transition = "entry") {
  if (!LEVEL_TWO_ENVIRONMENT_TRANSITIONS.includes(transition)) {
    throw new RangeError(`Unknown Level 2 environment transition: ${transition}`);
  }
  const records = materializeLevelTwoEnvironment(level);
  const ids = new Set(records.map(({ id }) => id));
  if (ids.size !== records.length) throw new RangeError("Duplicate Level 2 environment ID");
  return Object.freeze({
    transition,
    revision: (previous?.revision ?? 0) + 1,
    records: Object.freeze(records.map((record) => Object.freeze(record))),
  });
}

export function createLevelTwoEnvironment(level) {
  return transitionLevelTwoEnvironment(undefined, level, "entry").records;
}
